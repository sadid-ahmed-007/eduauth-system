const db = require('../config/db');
const {
    sendAccountApprovedEmail,
    sendInstitutionAccessEmail,
    sendProfileRequestDecisionEmail
} = require('../services/emailService');

// --- GETTERS ---

// 1. Get Pending Users (Both Students and Institutions)
const getPendingUsers = async (req, res) => {
    const { type } = req.query;
    if (type !== 'student' && type !== 'institution') {
        return res.status(400).json({ message: "Invalid type. Use 'student' or 'institution'." });
    }

    const connection = await db.getConnection();
    try {
        let query = '';
        if (type === 'student') {
            query = `SELECT u.user_id, u.email, s.photo_url, si.full_name, si.identity_number_hash AS nid, u.status
                     FROM users u
                     JOIN students s ON u.user_id = s.user_id
                     JOIN student_identities si ON s.identity_id = si.identity_id
                     WHERE u.role = 'student' AND u.status = 'pending'`;
        } else {
            query = `SELECT u.user_id, u.email, i.institution_name, i.institution_type, i.registration_number, i.status
                     FROM users u
                     JOIN institutions i ON u.user_id = i.user_id
                     WHERE u.role = 'institution' AND u.status = 'pending' AND i.status = 'pending'`;
        }

        const [rows] = await connection.execute(query);

        res.json(rows);
    } catch (error) {
        console.error("Admin Pending Error:", error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};

// 2. Get Active Institutions
const getActiveInstitutions = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT u.user_id,
                    i.institution_name,
                    i.institution_type,
                    i.can_issue_certificates
             FROM users u
             JOIN institutions i ON i.user_id = u.user_id
             WHERE u.role = 'institution'
               AND u.status = 'active'
               AND i.status = 'approved'`
        );
        res.json(rows);
    } catch (error) {
        console.error("Admin Load Error:", error);
        res.status(500).json({ message: 'Failed to load institutions' });
    } finally {
        connection.release();
    }
};

// --- ACTIONS ---

// 3. Approve Any User
const approveUser = async (req, res) => {
    const { userId } = req.params;
    const adminUserId = req.user?.user_id || null;
    const connection = await db.getConnection();
    try {
        const [users] = await connection.execute(
            "SELECT user_id, role, status, email FROM users WHERE user_id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userWasActive = users[0].status === 'active';
        let institutionWasApproved = false;

        if (users[0].role === 'institution') {
            const [instRows] = await connection.execute(
                'SELECT status FROM institutions WHERE user_id = ?',
                [userId]
            );
            if (instRows.length > 0) {
                institutionWasApproved = instRows[0].status === 'approved';
            }
        }

        await connection.beginTransaction();

        if (!userWasActive) {
            await connection.execute(
                "UPDATE users SET status = 'active' WHERE user_id = ?",
                [userId]
            );
        }

        const role = users[0].role;
        if (role === 'student') {
            await connection.execute(
                `UPDATE student_identities si
                 JOIN students s ON s.identity_id = si.identity_id
                 SET si.identity_verified = 1, si.verified_by = ?, si.verified_at = NOW()
                 WHERE s.user_id = ?`,
                [adminUserId, userId]
            );
        }

        if (role === 'institution') {
            await connection.execute(
                `UPDATE institutions
                 SET status = 'approved',
                     is_verified = 1,
                     verified_by = ?,
                     verified_at = NOW(),
                     can_issue_certificates = 1
                 WHERE user_id = ?`,
                [adminUserId, userId]
            );
        }

        await connection.commit();

        try {
            const shouldEmail = !userWasActive || (users[0].role === 'institution' && !institutionWasApproved);
            if (!shouldEmail) {
                res.json({ message: 'User already active' });
                return;
            }

            const [profileRows] = await connection.execute(
                `SELECT u.email,
                        u.role,
                        si.full_name,
                        i.institution_name
                 FROM users u
                 LEFT JOIN students s ON u.user_id = s.user_id
                 LEFT JOIN student_identities si ON s.identity_id = si.identity_id
                 LEFT JOIN institutions i ON u.user_id = i.user_id
                 WHERE u.user_id = ?`,
                [userId]
            );

            if (profileRows.length > 0) {
                const profile = profileRows[0];
                const displayName = profile.role === 'institution'
                    ? profile.institution_name
                    : profile.full_name;
                await sendAccountApprovedEmail({
                    to: profile.email,
                    role: profile.role,
                    name: displayName
                });
            }
        } catch (emailError) {
            console.error('Approval email failed:', emailError);
        }

        res.json({ message: 'User Approved Successfully' });
    } catch (error) {
        await connection.rollback();
        console.error("Approval Error:", error);
        res.status(500).json({ message: 'Failed to approve user' });
    } finally {
        connection.release();
    }
};

// 4. Toggle Issue Permission (Stop Upload Access)
const toggleIssuePermission = async (req, res) => {
    const { userId } = req.params;
    const { canIssue } = req.body; // true or false
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT i.institution_name,
                    i.can_issue_certificates,
                    u.email
             FROM institutions i
             JOIN users u ON i.user_id = u.user_id
             WHERE i.user_id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Institution not found' });
        }

        const currentStatus = Boolean(rows[0].can_issue_certificates);
        if (currentStatus === Boolean(canIssue)) {
            return res.json({ message: 'Permission already set' });
        }

        await connection.execute(
            "UPDATE institutions SET can_issue_certificates = ? WHERE user_id = ?",
            [canIssue, userId]
        );

        try {
            await sendInstitutionAccessEmail({
                to: rows[0].email,
                institutionName: rows[0].institution_name,
                canIssue: Boolean(canIssue)
            });
        } catch (emailError) {
            console.error('Access email failed:', emailError);
        }

        res.json({ message: `Permission updated to ${canIssue}` });
    } finally {
        connection.release();
    }
};

// 5. Get Pending Profile Requests
const getProfileRequests = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT 
                pr.request_id,
                pr.requested_at,
                pr.proposed_full_name,
                pr.proposed_date_of_birth,
                pr.proposed_identity_type,
                pr.proposed_identity_number_hash AS proposed_identity_hash,
                pr.proposed_photo_url,
                pr.proof_document_path,
                u.email,
                si.full_name AS current_full_name,
                DATE_FORMAT(si.date_of_birth, '%Y-%m-%d') AS current_date_of_birth,
                si.identity_type AS current_identity_type,
                si.identity_number_hash AS current_identity_hash,
                si.phone AS current_phone,
                si.address AS current_address,
                st.photo_url AS current_photo_url
             FROM profile_update_requests pr
             JOIN users u ON pr.user_id = u.user_id
             JOIN student_identities si ON pr.identity_id = si.identity_id
             JOIN students st ON pr.user_id = st.user_id
             WHERE pr.status = 'pending'
             ORDER BY pr.requested_at ASC`
        );

        res.json(rows);
    } catch (error) {
        console.error('Profile Request Load Error:', error);
        res.status(500).json({ message: 'Failed to load profile requests' });
    } finally {
        connection.release();
    }
};

// 6. Review Profile Request
const reviewProfileRequest = async (req, res) => {
    const { requestId } = req.params;
    const { action, comment } = req.body;
    const adminUserId = req.user?.user_id || null;

    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
    }

    const connection = await db.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT 
                pr.request_id,
                pr.status,
                pr.user_id,
                pr.identity_id,
                pr.proposed_full_name,
                DATE_FORMAT(pr.proposed_date_of_birth, '%Y-%m-%d') AS proposed_date_of_birth,
                pr.proposed_identity_type,
                pr.proposed_identity_number_hash,
                pr.proposed_photo_url,
                pr.proof_document_path,
                u.email,
                si.full_name AS current_full_name
             FROM profile_update_requests pr
             JOIN users u ON pr.user_id = u.user_id
             JOIN student_identities si ON pr.identity_id = si.identity_id
             WHERE pr.request_id = ?`,
            [requestId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = rows[0];
        if (request.status !== 'pending') {
            return res.status(409).json({ message: 'Request already reviewed' });
        }

        await connection.beginTransaction();

        if (action === 'approve') {
            const updates = [];
            const params = [];

            if (request.proposed_full_name) {
                updates.push('full_name = ?');
                params.push(request.proposed_full_name);
            }
            if (request.proposed_date_of_birth) {
                updates.push('date_of_birth = ?');
                params.push(request.proposed_date_of_birth);
            }
            if (request.proposed_identity_type) {
                updates.push('identity_type = ?');
                params.push(request.proposed_identity_type);
            }
            if (request.proposed_identity_number_hash) {
                updates.push('identity_number_hash = ?');
                params.push(request.proposed_identity_number_hash);
            }
            if (request.proof_document_path) {
                updates.push('verification_document_path = ?');
                params.push(request.proof_document_path);
            }

            if (updates.length > 0) {
                updates.push('identity_verified = 1');
                updates.push('verified_by = ?');
                params.push(adminUserId);
                updates.push('verified_at = NOW()');

                params.push(request.identity_id);
                await connection.execute(
                    `UPDATE student_identities SET ${updates.join(', ')} WHERE identity_id = ?`,
                    params
                );
            }

            if (request.proposed_photo_url) {
                await connection.execute(
                    'UPDATE students SET photo_url = ? WHERE user_id = ?',
                    [request.proposed_photo_url, request.user_id]
                );
            }
        }

        await connection.execute(
            `UPDATE profile_update_requests
             SET status = ?, reviewed_at = NOW(), reviewed_by = ?, reviewer_comment = ?
             WHERE request_id = ?`,
            [action === 'approve' ? 'approved' : 'rejected', adminUserId, comment || null, requestId]
        );

        await connection.commit();

        try {
            await sendProfileRequestDecisionEmail({
                to: request.email,
                studentName: request.current_full_name,
                status: action === 'approve' ? 'approved' : 'rejected',
                comment: comment || ''
            });
        } catch (emailError) {
            console.error('Profile request email failed:', emailError);
        }

        res.json({ message: `Request ${action}d successfully` });
    } catch (error) {
        await connection.rollback();
        console.error('Profile Request Review Error:', error);
        res.status(500).json({ message: 'Failed to review request' });
    } finally {
        connection.release();
    }
};

module.exports = {
    getPendingUsers,
    getActiveInstitutions,
    approveUser,
    toggleIssuePermission,
    getProfileRequests,
    reviewProfileRequest
};
