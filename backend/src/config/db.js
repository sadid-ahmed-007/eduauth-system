const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Create the pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convert to Promise-based pool (allows using async/await)
const promisePool = pool.promise();

// Test the connection immediately when this file is loaded
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database Connection Failed:', err.code);
        console.error('Check if XAMPP MySQL is running and DB_NAME is correct.');
    } else {
        console.log('✅ Connected to XAMPP MySQL Database');
        connection.release();
    }
});

module.exports = promisePool;