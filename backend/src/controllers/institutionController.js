const db = require('../config/db');
const crypto = require('crypto'); // <--- IMPORT THIS

// 1. Enroll a Student
const enrollStudent = async (req, res) => {
    const { localStudentId, nid, department, session } = req.body;
    const institutionId = req.user.institution_id; 

    // DEBUG LOGS (Check your terminal if this fails again)
    console.log("Enrollment Attempt:", { institutionId, nid, localStudentId });

    const connection = await db.getConnection();
    try {
        // --- CRITICAL FIX: HASH THE INPUT NID ---
        // The DB stores the SHA-256 hash, not the plain NID.
        const nidHash = crypto.createHash('sha256').update(nid).digest('hex');
        // ----------------------------------------

        // Step A: Find the Global Student by NID Hash
        const [students] = await connection.execute(
            `SELECT s.student_id 
             FROM students s 
             JOIN student_identities si ON s.identity_id = si.identity_id 
             WHERE si.identity_number_hash = ?`, 
            [nidHash] // <--- Query using the HASH
        );

        if (students.length === 0) {
            return res.status(404).json({ message: 'Student NID not found. They must register on EduAuth first.' });
        }

        const globalStudentId = students[0].student_id;

        // Step B: Check if already enrolled
        const [existing] = await connection.execute(
            `SELECT * FROM institution_enrollments WHERE institution_id = ? AND student_id = ?`,
            [institutionId, globalStudentId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Student is already enrolled.' });
        }

        // Step C: Insert Enrollment
        await connection.execute(
            `INSERT INTO institution_enrollments (institution_id, student_id, local_student_id, department, session_year)
             VALUES (?, ?, ?, ?, ?)`,
            [institutionId, globalStudentId, localStudentId, department, session]
        );

        res.json({ message: 'Student Enrolled Successfully' });

    } catch (error) {
        console.error("Enrollment Error:", error);
        res.status(500).json({ message: 'Server Error during enrollment' });
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