const authService = require('../services/authService');
const db = require('../config/db');

const register = async (req, res) => {
    try {
        // Handle Photo Upload Path
        const userData = {
            ...req.body,
            photoUrl: req.file ? `/uploads/${req.file.filename}` : null
        };

        const result = await authService.registerUser(userData);

        res.status(201).json({
            message: 'User registered successfully',
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Safety check to prevent "Incorrect arguments" error
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const result = await authService.loginUser(email, password);

        res.json({
            message: 'Login successful',
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: error.message });
    }
};

const getMe = async (req, res) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const connection = await db.getConnection();
    try {
        let institutionName = null;
        let institutionStatus = null;
        let canIssue = user.can_issue;

        if (user.role === 'institution' && user.institution_id) {
            const [rows] = await connection.execute(
                `SELECT institution_name, status, can_issue_certificates 
                 FROM institutions 
                 WHERE institution_id = ?`,
                [user.institution_id]
            );

            if (rows.length > 0) {
                institutionName = rows[0].institution_name;
                institutionStatus = rows[0].status;
                canIssue = rows[0].can_issue_certificates;
            }
        }

        res.json({
            data: {
                user_id: user.user_id,
                email: user.email,
                role: user.role,
                status: user.status,
                institution_id: user.institution_id || null,
                student_id: user.student_id || null,
                can_issue: canIssue,
                institution_name: institutionName,
                institution_status: institutionStatus
            }
        });
    } catch (error) {
        console.error('GetMe Error:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};

module.exports = { register, login, getMe };
