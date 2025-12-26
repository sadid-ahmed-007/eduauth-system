const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// 1. Issue Certificate (Strict Mode)
const issueCertificate = async (req, res) => {
    const { localStudentId, credentialName, type, issueDate, fieldOfStudy, gradeGpa, metadata, details } = req.body;
    const issuerId = req.user.institution_id;

    if (!localStudentId || !credentialName || !type || !issueDate) {
        return res.status(400).json({ message: 'Local student ID, credential name, type, and issue date are required.' });
    }

    if (!issuerId) {
        return res.status(403).json({ message: 'Institution context missing. Please re-login.' });
    }

    if (req.user.can_issue === 0 || req.user.can_issue === false) {
        return res.status(403).json({ message: 'Issuing is disabled by the authority.' });
    }

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
             AND ie.local_student_id = ?`,
            [issuerId, localStudentId]
        );

        if (enrolledStudent.length === 0) {
            return res.status(403).json({ message: 'Access Denied: This student is not enrolled in your institution.' });
        }

        const studentId = enrolledStudent[0].student_id;
        const studentName = enrolledStudent[0].full_name;

        // Step B: Generate Unique Hash
        const incomingMetadata = metadata || details || {};
        const normalizedMetadata = {
            ...incomingMetadata,
            major: fieldOfStudy || incomingMetadata.major || null,
            cgpa: gradeGpa || incomingMetadata.cgpa || null
        };

        const uniqueString = `${issuerId}-${studentId}-${credentialName}-${issueDate}-${JSON.stringify(normalizedMetadata)}-${Date.now()}`;
        const certificateHash = crypto.createHash('sha256').update(uniqueString).digest('hex');
        const certId = uuidv4();

        // Step C: Insert Certificate
        await connection.execute(
            `INSERT INTO certificates 
            (certificate_id, student_id, issuer_id, certificate_type, credential_name, field_of_study, grade_gpa, issue_date, certificate_hash, status, metadata) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
            [
                certId,
                studentId,
                issuerId,
                type,
                credentialName,
                fieldOfStudy || normalizedMetadata.major,
                gradeGpa || normalizedMetadata.cgpa,
                issueDate,
                certificateHash,
                JSON.stringify(normalizedMetadata)
            ]
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
