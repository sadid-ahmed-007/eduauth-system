const db = require('../src/config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const run = async () => {
    const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@ugc.gov.bd');
    const adminPassword = process.env.ADMIN_PASSWORD || process.argv[2];

    if (!adminPassword) {
        console.error('ADMIN_PASSWORD env var or first CLI arg is required.');
        process.exit(1);
    }

    const connection = await db.getConnection();
    try {
        const [existing] = await connection.execute(
            'SELECT user_id FROM users WHERE email = ?',
            [adminEmail]
        );

        if (existing.length > 0) {
            console.log(`Admin user already exists for ${adminEmail}`);
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminPassword, salt);
        const userId = uuidv4();

        await connection.execute(
            'INSERT INTO users (user_id, email, password_hash, role, status, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, adminEmail, passwordHash, 'admin', 'active', 1]
        );

        console.log(`Admin user created for ${adminEmail}`);
    } finally {
        connection.release();
        await db.end();
    }
};

run().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
