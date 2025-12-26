const db = require('../config/db');

// --- GETTERS ---

// 1. Get Pending Users (Both Students and Institutions)
// DEBUG VERSION
const getPendingUsers = async (req, res) => {
    const { type } = req.query; 
    console.log(`[DEBUG] Admin requested pending list for: ${type}`);

    const connection = await db.getConnection();
    try {
        let query = '';
        if (type === 'student') {
            // Log raw count first
            const [count] = await connection.execute("SELECT count(*) as count FROM users WHERE role='student' AND status='pending'");
            console.log(`[DEBUG] Pending Students in Users table: ${count[0].count}`);

            query = `SELECT u.user_id, u.email, s.photo_url, si.full_name, si.identity_number_hash as nid, u.status 
                     FROM users u 
                     JOIN students s ON u.user_id = s.user_id 
                     JOIN student_identities si ON s.identity_id = si.identity_id
                     WHERE u.status = 'pending'`;
        } else {
            // Log raw count first
            const [count] = await connection.execute("SELECT count(*) as count FROM users WHERE role='institution' AND status='pending'");
            console.log(`[DEBUG] Pending Institutions in Users table: ${count[0].count}`);

            query = `SELECT u.user_id, u.email, i.institution_name, i.institution_type, i.registration_number, u.status 
                     FROM users u 
                     JOIN institutions i ON u.user_id = i.user_id 
                     WHERE u.status = 'pending'`;
        }

        const [rows] = await connection.execute(query);
        console.log(`[DEBUG] Query returned ${rows.length} rows`);
        
        if (rows.length === 0) {
            console.log("[DEBUG] WARNING: Rows is 0. This means the JOIN failed (Profile missing) or Status is not 'pending'.");
        }

        res.json(rows);
    } catch (error) {
        console.error("[DEBUG] ERROR:", error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};

// 2. Get Active Institutions (With 'Can Issue' status)
// 2. Get Active Institutions
const getActiveInstitutions = async (req, res) => {
    const connection = await db.getConnection();
    try {
        // Query adjusted for the new schema
        const [rows] = await connection.execute(
            `SELECT u.user_id, i.institution_name, i.institution_type, i.can_issue_certificates 
             FROM users u 
             JOIN institutions i ON u.user_id = i.user_id 
             WHERE u.status = 'active'` // Ensure we only get active ones
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
    const connection = await db.getConnection();
    try {
        await connection.execute("UPDATE users SET status = 'active' WHERE user_id = ?", [userId]);
        
        // Also update institutions table status if it exists
        await connection.execute("UPDATE institutions SET status = 'approved' WHERE user_id = ?", [userId]);

        res.json({ message: 'User Approved Successfully' });
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
        await connection.execute(
            "UPDATE institutions SET can_issue_certificates = ? WHERE user_id = ?", 
            [canIssue, userId]
        );
        res.json({ message: `Permission updated to ${canIssue}` });
    } finally {
        connection.release();
    }
};

module.exports = { getPendingUsers, getActiveInstitutions, approveUser, toggleIssuePermission };