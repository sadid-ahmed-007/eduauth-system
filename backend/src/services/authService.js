const db = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

dotenv.config();

const hashIdentityNumber = (identityNumber) => {
    const normalized = String(identityNumber || '').trim();
    if (!normalized) {
        return null;
    }
    return crypto.createHash('sha256').update(normalized).digest('hex');
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const allowedInstitutionTypes = new Set([
    'university',
    'college',
    'polytechnic',
    'vocational_school',
    'training_center',
    'board'
]);

// Register User
const registerUser = async (userData) => {
    const { email, password, role } = userData;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Check if user exists (by email)
        const normalizedEmail = normalizeEmail(email);
        const [existingUser] = await connection.execute(
            'SELECT email FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (existingUser.length > 0) {
            throw new Error('User already exists');
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create User ID & Determine Status
        const userId = uuidv4();
        const initialStatus = 'pending';

        // 4. Insert into USERS table
        await connection.execute(
            'INSERT INTO users (user_id, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
            [userId, normalizedEmail, hashedPassword, role, initialStatus]
        );

        // 5. Handle Specific Roles
        const profileId = uuidv4();

        if (role === 'student') {
            const identityId = uuidv4();
            const identityNumber = userData.identityNumber || userData.nid;
            const identityType = userData.identityType || userData.identity_type || 'nid';

            if (!identityNumber) {
                throw new Error('Identity number (NID) is required for students');
            }

            if (!userData.fullName || !userData.dob) {
                throw new Error('Full name and date of birth are required for students');
            }

            if (!userData.photoUrl) {
                throw new Error('Profile photo is required for students');
            }

            const identityNumberHash = hashIdentityNumber(identityNumber);
            if (!identityNumberHash) {
                throw new Error('Identity number (NID) is required for students');
            }

            const [existingNid] = await connection.execute(
                'SELECT identity_id FROM student_identities WHERE identity_number_hash = ?',
                [identityNumberHash]
            );

            if (existingNid.length > 0) {
                throw new Error('This NID is already registered to another account.');
            }

            await connection.execute(
                `INSERT INTO student_identities 
                 (identity_id, user_id, identity_type, identity_number_hash, full_name, date_of_birth) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [identityId, userId, identityType, identityNumberHash, userData.fullName, userData.dob]
            );

            await connection.execute(
                'INSERT INTO students (student_id, identity_id, user_id, photo_url) VALUES (?, ?, ?, ?)',
                [profileId, identityId, userId, userData.photoUrl]
            );
        } else if (role === 'institution') {
            if (!userData.institutionName || !userData.regNumber) {
                throw new Error("Institution name and Registration Number are required");
            }

            const institutionType = userData.institutionType || 'university';
            if (!allowedInstitutionTypes.has(institutionType)) {
                throw new Error('Invalid institution type');
            }

            await connection.execute(
                `INSERT INTO institutions 
                (institution_id, user_id, institution_name, institution_type, registration_number, status) 
                VALUES (?, ?, ?, ?, ?, 'pending')`,
                [profileId, userId, userData.institutionName, institutionType, userData.regNumber]
            );
        } else {
            throw new Error('Invalid role for self-registration');
        }

        await connection.commit();
        return { user_id: userId, email: normalizedEmail, role };
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
        const normalizedEmail = normalizeEmail(email);
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (users.length === 0) {
            throw new Error('Invalid credentials');
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        if (user.status !== 'active') {
            throw new Error(`Account is ${user.status}. Please wait for admin approval.`);
        }

        let specificId = null;
        let institutionName = undefined;
        if (user.role === 'institution') {
            const [inst] = await connection.execute(
                'SELECT institution_id, institution_name, status FROM institutions WHERE user_id = ?',
                [user.user_id]
            );
            if (inst.length === 0) {
                throw new Error('Institution profile not found.');
            }
            if (inst[0].status !== 'approved') {
                throw new Error('Institution account is pending approval.');
            }
            specificId = inst[0].institution_id;
            institutionName = inst[0].institution_name;
        } else if (user.role === 'student') {
            const [stud] = await connection.execute('SELECT student_id FROM students WHERE user_id = ?', [user.user_id]);
            if (stud.length > 0) specificId = stud[0].student_id;
        }

        const token = jwt.sign(
            { 
                id: user.user_id, 
                role: user.role,
                institution_id: user.role === 'institution' ? specificId : undefined,
                student_id: user.role === 'student' ? specificId : undefined
            },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        return {
            user_id: user.user_id,
            email: user.email,
            role: user.role,
            institution_name: user.role === 'institution' ? institutionName : undefined,
            token
        };
    } finally {
        connection.release();
    }
};

module.exports = { registerUser, loginUser };
