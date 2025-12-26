const db = require('../config/db');

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
            "SELECT user_id, role, status FROM users WHERE user_id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await connection.beginTransaction();

        await connection.execute(
            "UPDATE users SET status = 'active' WHERE user_id = ?",
            [userId]
        );

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
        const [result] = await connection.execute(
            "UPDATE institutions SET can_issue_certificates = ? WHERE user_id = ?", 
            [canIssue, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Institution not found' });
        }
        res.json({ message: `Permission updated to ${canIssue}` });
    } finally {
        connection.release();
    }
};

module.exports = { getPendingUsers, getActiveInstitutions, approveUser, toggleIssuePermission };
