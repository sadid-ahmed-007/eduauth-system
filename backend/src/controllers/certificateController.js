const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// 1. Issue Certificate (Strict Mode)
const issueCertificate = async (req, res) => {
    // We now accept 'localStudentId' OR 'nid', but we prioritize checking enrollment
    const { studentIdentifier, credentialName, type, issueDate, details } = req.body; 
    const issuerId = req.user.institution_id;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Step A: Find the Student inside YOUR Enrollment List
        // This ensures you can ONLY issue to students you have enrolled.
        const [enrolledStudent] = await connection.execute(
            `SELECT s.student_id, si.full_name 
             FROM institution_enrollments ie
             JOIN students s ON ie.student_id = s.student_id
             JOIN student_identities si ON s.identity_id = si.identity_id
             WHERE ie.institution_id = ? 
             AND (ie.local_student_id = ? OR si.identity_number_hash = ?)`,
            [issuerId, studentIdentifier, studentIdentifier]
        );

        if (enrolledStudent.length === 0) {
            return res.status(403).json({ message: 'Access Denied: This student is not enrolled in your institution.' });
        }

        const studentId = enrolledStudent[0].student_id;
        const studentName = enrolledStudent[0].full_name;

        // Step B: Generate Unique Hash
        const uniqueString = `${issuerId}-${studentId}-${credentialName}-${Date.now()}`;
        const certificateHash = crypto.createHash('sha256').update(uniqueString).digest('hex');
        const certId = uuidv4();

        // Step C: Insert Certificate
        await connection.execute(
            `INSERT INTO certificates 
            (certificate_id, student_id, issuer_id, credential_name, certificate_type, issue_date, certificate_hash, status, metadata) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
            [certId, studentId, issuerId, credentialName, type, issueDate, certificateHash, JSON.stringify(details || {})]
        );

        await connection.commit();

        res.status(201).json({
            message: 'Certificate Issued Successfully',
            certificateHash,
            studentName
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Failed to issue certificate' });
    } finally {
        connection.release();
    }
};

// 2. Get Student's Certificates (For Dashboard)
const getMyCertificates = async (req, res) => {
    const studentId = req.user.student_id; 

    const connection = await db.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT c.certificate_hash, c.credential_name, c.certificate_type, c.issue_date, c.status, i.institution_name 
             FROM certificates c
             JOIN institutions i ON c.issuer_id = i.institution_id
             WHERE c.student_id = ?`,
            [studentId]
        );
        res.json({ certificates: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching certificates" });
    } finally {
        connection.release();
    }
};

module.exports = { issueCertificate, getMyCertificates };