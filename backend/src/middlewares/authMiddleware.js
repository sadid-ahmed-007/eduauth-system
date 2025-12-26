const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const connection = await db.getConnection();
            try {
                // 1. Fetch User AND their current Status from DB (Don't trust the token alone)
                const [users] = await connection.execute(
                    'SELECT user_id, email, role, status FROM users WHERE user_id = ?', 
                    [decoded.id]
                );

                if (users.length === 0) {
                    return res.status(401).json({ message: 'User no longer exists.' });
                }

                const user = users[0];

                // 2. Global Status Check
                if (user.status !== 'active') {
                    return res.status(403).json({ message: `Access denied. Your account status is: ${user.status}` });
                }

                // 3. If Institution, check if they are "Blocked" from issuing
                if (user.role === 'institution') {
                    const [instData] = await connection.execute(
                        'SELECT institution_id, can_issue_certificates FROM institutions WHERE user_id = ?',
                        [user.user_id]
                    );
                    if (instData.length > 0) {
                        user.institution_id = instData[0].institution_id;
                        user.can_issue = instData[0].can_issue_certificates;
                    }
                }

                // 4. If Student, fetch their profile ID
                if (user.role === 'student') {
                    const [studData] = await connection.execute(
                        'SELECT student_id FROM students WHERE user_id = ?',
                        [user.user_id]
                    );
                    if (studData.length > 0) {
                        user.student_id = studData[0].student_id;
                    }
                }

                req.user = user;
                next();

            } finally {
                connection.release();
            }
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to restrict access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    };
};

module.exports = { protect, authorize }; // <--- MUST HAVE BOTH