const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { generateCertificateHash } = require('../utils/cryptoUtils');

const issueCertificate = async (certData, loggedInUserId) => {
    const { studentNid, credentialName, type, issueDate, fieldOfStudy, gradeGpa, metadata, details } = certData;
    const connection = await db.getConnection();

    try {
        // ---------------------------------------------------------
        // FIX START: Get the Real Institution ID
        // ---------------------------------------------------------
        const [institution] = await connection.execute(
            'SELECT institution_id FROM institutions WHERE user_id = ?',
            [loggedInUserId]
        );

        if (institution.length === 0) {
            throw new Error('Institution profile not found. Are you logged in as an institution?');
        }

        const realIssuerId = institution[0].institution_id;
        // ---------------------------------------------------------
        // FIX END
        // ---------------------------------------------------------

        // 1. Find Student by NID
        // We join with users table to handle the data structure correctly
        const [identity] = await connection.execute(
            `SELECT s.student_id
             FROM student_identities si
             JOIN students s ON si.identity_id = s.identity_id
             WHERE si.identity_number_hash = ?`,
            [studentNid]
        );

        if (identity.length === 0) {
            throw new Error('Student not found with this NID');
        }

        const studentId = identity[0].student_id;

        // 2. Generate Unique Hash (Digital Signature)
        const incomingMetadata = metadata || details || {};
        const normalizedMetadata = {
            ...incomingMetadata,
            major: fieldOfStudy || incomingMetadata.major || null,
            cgpa: gradeGpa || incomingMetadata.cgpa || null
        };
        const uniqueString = `${studentId}-${realIssuerId}-${credentialName}-${issueDate}-${JSON.stringify(normalizedMetadata)}`;
        const certHash = generateCertificateHash(uniqueString);

        // 3. Insert into Database
        const certUuid = uuidv4();
        
        // Note: We use 'realIssuerId' here, NOT 'loggedInUserId'
        await connection.execute(
            `INSERT INTO certificates 
            (certificate_id, student_id, issuer_id, certificate_type, credential_name, field_of_study, grade_gpa, issue_date, certificate_hash, status, metadata) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
            [
                certUuid,
                studentId,
                realIssuerId,
                type,
                credentialName,
                fieldOfStudy || normalizedMetadata.major,
                gradeGpa || normalizedMetadata.cgpa,
                issueDate,
                certHash,
                JSON.stringify(normalizedMetadata)
            ]
        );

        return { certificate_id: certUuid, certificate_hash: certHash };

    } finally {
        connection.release();
    }
};

module.exports = { issueCertificate };
