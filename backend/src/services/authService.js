const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

dotenv.config();

// Register User
const registerUser = async (userData) => {
    const { email, password, role } = userData;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Check if user exists
        const [existingUser] = await connection.execute(
            'SELECT email FROM users WHERE email = ?', 
            [email]
        );

        if (existingUser.length > 0) {
            throw new Error('User already exists');
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

// 3. Create User ID & Determine Status
        const userId = uuidv4();
        
        // --- FORCE PENDING STATUS HERE ---
        // Do NOT use: role === 'institution' ? 'pending' : 'active';
        const initialStatus = 'pending'; 
        // ---------------------------------

        // 4. Insert into USERS table
        await connection.execute(
            'INSERT INTO users (user_id, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
            [userId, email, hashedPassword, role, initialStatus]
        );

        // 5. Handle Specific Roles
        const profileId = uuidv4();

        if (role === 'student') {
            // Identity Logic
            const identityId = uuidv4();
            
            // Insert into STUDENT_IDENTITIES
            // <--- FIX IS HERE: We added 'user_id' to this query
            await connection.execute(
                'INSERT INTO student_identities (identity_id, user_id, identity_number_hash, full_name, date_of_birth) VALUES (?, ?, ?, ?, ?)',
                [identityId, userId, userData.nid, userData.fullName, userData.dob]
            );

            // Insert into STUDENTS table
            await connection.execute(
                'INSERT INTO students (student_id, identity_id, user_id, photo_url) VALUES (?, ?, ?, ?)',
                [profileId, identityId, userId, userData.photoUrl || null] 
            );

        } else if (role === 'institution') {
            if (!userData.institutionName || !userData.regNumber) {
                throw new Error("Institution name and Registration Number are required");
            }

            // Insert into INSTITUTIONS table
            await connection.execute(
                `INSERT INTO institutions 
                (institution_id, user_id, institution_name, institution_type, registration_number, status) 
                VALUES (?, ?, ?, ?, ?, 'pending')`,
                [profileId, userId, userData.institutionName, userData.institutionType || 'university', userData.regNumber]
            );
        }

        await connection.commit();
        return { user_id: userId, email, role };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Login User
const loginUser = async (email, password) => {
    const connection = await db.getConnection();
    try {
        // 1. Find User
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE email = ?', 
            [email]
        );

        if (users.length === 0) {
            throw new Error('Invalid credentials');
        }

        const user = users[0];

        // 2. Check Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        // 3. Check Status (Block if pending or rejected)
        if (user.status !== 'active') {
            throw new Error(`Account is ${user.status}. Please wait for admin approval.`);
        }

        // 4. Generate Token
        const token = jwt.sign(
            { id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        return {
            user_id: user.user_id,
            email: user.email,
            role: user.role,
            token
        };

    } finally {
        connection.release();
    }
};

module.exports = { registerUser, loginUser };