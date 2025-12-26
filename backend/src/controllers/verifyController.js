const db = require('../config/db');

const verifyCertificate = async (req, res) => {
    const { hash } = req.params; // Get hash from URL

    const connection = await db.getConnection();
    try {
        // SQL Query: specific join to get readable names instead of UUIDs
        const query = `
            SELECT 
                c.certificate_hash,
                c.credential_name,
                c.issue_date,
                c.status,
                s.full_name as student_name,
                s.photo_url,
                i.institution_name as issuer_name,
                i.institution_type
            FROM certificates c
            JOIN students st ON c.student_id = st.student_id
            JOIN student_identities s ON st.identity_id = s.identity_id
            JOIN institutions i ON c.issuer_id = i.institution_id
            WHERE c.certificate_hash = ?
        `;

        const [results] = await connection.execute(query, [hash]);

        if (results.length === 0) {
            return res.status(404).json({ 
                valid: false, 
                message: 'Certificate not found or invalid hash.' 
            });
        }

        const cert = results[0];

        // Automatic Audit Log (Bonus: Tracking who verified it)
        await connection.execute(
            `INSERT INTO verification_logs (log_id, certificate_id, verifier_type, verification_result) 
             VALUES (UUID(), (SELECT certificate_id FROM certificates WHERE certificate_hash = ?), 'public', 'valid')`,
            [hash]
        );

        res.json({
            valid: true,
            data: cert
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during verification' });
    } finally {
        connection.release();
    }
};

module.exports = { verifyCertificate };