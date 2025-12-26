const db = require('../config/db');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { sendProfileRequestReceivedEmail } = require('../services/emailService');

const allowedIdentityTypes = new Set(['nid', 'birth_certificate']);

const hashIdentityNumber = (identityNumber) => {
    const normalized = String(identityNumber || '').trim();
    if (!normalized) {
        return null;
    }
    return crypto.createHash('sha256').update(normalized).digest('hex');
};

const getMyCertificates = async (req, res) => {
    const userId = req.user?.user_id; // From JWT token

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const connection = await db.getConnection();
    try {
        // 1. Get all certs linked to this user's student profile
        // We join 'students' to link user_id -> student_id
        // We join 'institutions' to show who issued it
        const query = `
            SELECT 
                c.certificate_hash,
                c.credential_name,
                c.certificate_type,
                c.issue_date,
                c.status,
                i.institution_name
            FROM certificates c
            JOIN students s ON c.student_id = s.student_id
            JOIN institutions i ON c.issuer_id = i.institution_id
            WHERE s.user_id = ?
            ORDER BY c.issue_date DESC
        `;

        const [results] = await connection.execute(query, [userId]);

        res.json({
            count: results.length,
            certificates: results
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching certificates' });
    } finally {
        connection.release();
    }
};

const getMyProfile = async (req, res) => {
    const userId = req.user?.user_id;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const connection = await db.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT 
                u.email,
                si.full_name,
                si.date_of_birth,
                si.identity_type,
                si.identity_number_hash,
                si.phone,
                si.address,
                st.photo_url
             FROM users u
             JOIN student_identities si ON u.user_id = si.user_id
             JOIN students st ON u.user_id = st.user_id
             WHERE u.user_id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        const profile = rows[0];
        const [pendingRows] = await connection.execute(
            `SELECT request_id, requested_at
             FROM profile_update_requests
             WHERE user_id = ? AND status = 'pending'
             ORDER BY requested_at DESC
             LIMIT 1`,
            [userId]
        );

        res.json({
            profile: {
                email: profile.email,
                full_name: profile.full_name,
                date_of_birth: profile.date_of_birth
                    ? profile.date_of_birth.toISOString().split('T')[0]
                    : null,
                identity_type: profile.identity_type,
                identity_number_hash: profile.identity_number_hash,
                phone: profile.phone,
                address: profile.address,
                photo_url: profile.photo_url
            },
            pendingRequest: pendingRows.length > 0 ? pendingRows[0] : null
        });
    } catch (error) {
        console.error('Profile Load Error:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    } finally {
        connection.release();
    }
};

const updateMyContact = async (req, res) => {
    const userId = req.user?.user_id;
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : null;
    const address = typeof req.body.address === 'string' ? req.body.address.trim() : null;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!phone && !address) {
        return res.status(400).json({ message: 'Phone or address is required' });
    }

    const connection = await db.getConnection();
    try {
        await connection.execute(
            `UPDATE student_identities
             SET phone = COALESCE(?, phone),
                 address = COALESCE(?, address)
             WHERE user_id = ?`,
            [phone || null, address || null, userId]
        );

        res.json({ message: 'Contact details updated' });
    } catch (error) {
        console.error('Contact Update Error:', error);
        res.status(500).json({ message: 'Failed to update contact details' });
    } finally {
        connection.release();
    }
};

const submitProfileRequest = async (req, res) => {
    const userId = req.user?.user_id;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
        fullName,
        dob,
        identityType,
        identityNumber
    } = req.body;

    const proofFile = req.files?.proofDocument?.[0];
    const photoFile = req.files?.photo?.[0];

    const connection = await db.getConnection();
    try {
        const [pending] = await connection.execute(
            `SELECT request_id
             FROM profile_update_requests
             WHERE user_id = ? AND status = 'pending'
             LIMIT 1`,
            [userId]
        );

        if (pending.length > 0) {
            return res.status(409).json({ message: 'You already have a pending request.' });
        }

        const [currentRows] = await connection.execute(
            `SELECT 
                si.identity_id,
                si.full_name,
                si.date_of_birth,
                si.identity_type,
                si.identity_number_hash,
                u.email
             FROM users u
             JOIN student_identities si ON u.user_id = si.user_id
             WHERE u.user_id = ?`,
            [userId]
        );

        if (currentRows.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        const current = currentRows[0];
        const currentDob = current.date_of_birth
            ? current.date_of_birth.toISOString().split('T')[0]
            : null;

        const normalizedFullName = typeof fullName === 'string' ? fullName.trim() : '';
        const normalizedDob = typeof dob === 'string' ? dob.trim() : '';
        const normalizedIdentityType = typeof identityType === 'string' ? identityType.trim() : '';
        const normalizedIdentityNumber = typeof identityNumber === 'string' ? identityNumber.trim() : '';

        if (normalizedIdentityType && !allowedIdentityTypes.has(normalizedIdentityType)) {
            return res.status(400).json({ message: 'Invalid identity type' });
        }

        if (normalizedIdentityType && normalizedIdentityType !== current.identity_type && !normalizedIdentityNumber) {
            return res.status(400).json({ message: 'Identity number is required when changing identity type.' });
        }

        let proposedFullName = null;
        let proposedDob = null;
        let proposedIdentityType = null;
        let proposedIdentityHash = null;

        if (normalizedFullName && normalizedFullName !== current.full_name) {
            proposedFullName = normalizedFullName;
        }

        if (normalizedDob && normalizedDob !== currentDob) {
            proposedDob = normalizedDob;
        }

        if (normalizedIdentityNumber) {
            const hashed = hashIdentityNumber(normalizedIdentityNumber);
            if (!hashed) {
                return res.status(400).json({ message: 'Invalid identity number' });
            }
            if (hashed !== current.identity_number_hash) {
                const [existing] = await connection.execute(
                    `SELECT user_id
                     FROM student_identities
                     WHERE identity_number_hash = ? AND user_id <> ?`,
                    [hashed, userId]
                );
                if (existing.length > 0) {
                    return res.status(409).json({ message: 'This identity number is already registered.' });
                }
                proposedIdentityHash = hashed;
            }

            if (normalizedIdentityType && normalizedIdentityType !== current.identity_type) {
                proposedIdentityType = normalizedIdentityType;
            } else if (proposedIdentityHash) {
                proposedIdentityType = normalizedIdentityType || current.identity_type;
            }
        } else if (normalizedIdentityType && normalizedIdentityType !== current.identity_type) {
            proposedIdentityType = normalizedIdentityType;
        }

        const proposedPhotoUrl = photoFile ? `/uploads/${photoFile.filename}` : null;
        const requiresProof = Boolean(proposedFullName || proposedDob || proposedIdentityHash || proposedIdentityType);
        const proofPath = proofFile ? `/uploads/${proofFile.filename}` : null;

        if (requiresProof && !proofPath) {
            return res.status(400).json({ message: 'Proof document is required for name, DOB, or ID changes.' });
        }

        if (!proposedFullName && !proposedDob && !proposedIdentityHash && !proposedIdentityType && !proposedPhotoUrl) {
            return res.status(400).json({ message: 'No changes detected.' });
        }

        const requestId = uuidv4();
        await connection.execute(
            `INSERT INTO profile_update_requests
            (request_id, user_id, identity_id, status, proposed_full_name, proposed_date_of_birth, proposed_identity_type,
             proposed_identity_number_hash, proposed_photo_url, proof_document_path)
            VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
            [
                requestId,
                userId,
                current.identity_id,
                proposedFullName,
                proposedDob,
                proposedIdentityType,
                proposedIdentityHash,
                proposedPhotoUrl,
                proofPath
            ]
        );

        try {
            await sendProfileRequestReceivedEmail({
                to: current.email,
                studentName: current.full_name
            });
        } catch (emailError) {
            console.error('Profile request email failed:', emailError);
        }

        res.status(201).json({ message: 'Profile update request submitted' });
    } catch (error) {
        console.error('Profile Request Error:', error);
        res.status(500).json({ message: 'Failed to submit request' });
    } finally {
        connection.release();
    }
};

module.exports = { getMyCertificates, getMyProfile, updateMyContact, submitProfileRequest };
