const db = require('../config/db');
const crypto = require('crypto');

const hashIdentityNumber = (identityNumber) => {
    const normalized = String(identityNumber || '').trim();
    if (!normalized) {
        return null;
    }
    return crypto.createHash('sha256').update(normalized).digest('hex');
};

// 1. Enroll a Student
const enrollStudent = async (req, res) => {
    const { localStudentId, nid, department, session } = req.body;
    const institutionId = req.user.institution_id;

    if (!institutionId) {
        return res.status(403).json({ message: 'Institution context missing. Please re-login.' });
    }

    if (!nid || !localStudentId || !department || !session) {
        return res.status(400).json({ message: 'NID, local student ID, department, and session are required.' });
    }

    const nidHash = hashIdentityNumber(nid);
    if (!nidHash) {
        return res.status(400).json({ message: 'NID is required.' });
    }

    const connection = await db.getConnection();
    try {
        const [students] = await connection.execute(
            `SELECT s.student_id 
             FROM students s 
             JOIN student_identities si ON s.identity_id = si.identity_id 
             JOIN users u ON s.user_id = u.user_id
             WHERE si.identity_number_hash = ?
               AND u.role = 'student'
               AND u.status = 'active'`,
            [nidHash]
        );

        if (students.length === 0) {
            return res.status(404).json({ message: 'Student not found or not yet approved.' });
        }

        const globalStudentId = students[0].student_id;

        const [existing] = await connection.execute(
            `SELECT * FROM institution_enrollments WHERE institution_id = ? AND student_id = ?`,
            [institutionId, globalStudentId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Student is already enrolled.' });
        }

        const [existingLocalId] = await connection.execute(
            `SELECT enrollment_id FROM institution_enrollments WHERE institution_id = ? AND local_student_id = ?`,
            [institutionId, localStudentId]
        );

        if (existingLocalId.length > 0) {
            return res.status(409).json({ message: 'Local student ID is already in use.' });
        }

        await connection.execute(
            `INSERT INTO institution_enrollments (institution_id, student_id, local_student_id, department, session_year)
             VALUES (?, ?, ?, ?, ?)`,
            [institutionId, globalStudentId, localStudentId, department, session]
        );

        res.json({ message: 'Student Enrolled Successfully' });
    } catch (error) {
        console.error("Enrollment Error:", error);
        res.status(500).json({ message: 'Server Error' });
    } finally {
        connection.release();
    }
};

// 2. Get My Enrolled Students
const getMyStudents = async (req, res) => {
    const { session, department } = req.query;
    const institutionId = req.user.institution_id;

    let query = `
        SELECT ie.local_student_id, si.full_name, ie.department, ie.session_year, s.photo_url
        FROM institution_enrollments ie
        JOIN students s ON ie.student_id = s.student_id
        JOIN student_identities si ON s.identity_id = si.identity_id
        WHERE ie.institution_id = ?
    `;

    const params = [institutionId];

    if (session) {
        query += ` AND ie.session_year = ?`;
        params.push(session);
    }
    if (department) {
        query += ` AND ie.department = ?`;
        params.push(department);
    }

    const connection = await db.getConnection();
    try {
        const [rows] = await connection.execute(query, params);
        res.json(rows);
    } finally {
        connection.release();
    }
};

module.exports = { enrollStudent, getMyStudents };
