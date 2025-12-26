const db = require('../config/db');

const getMyCertificates = async (req, res) => {
    const userId = req.user.id; // From JWT token

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

module.exports = { getMyCertificates };