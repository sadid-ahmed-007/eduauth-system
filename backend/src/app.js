const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import Routes
const authRoutes = require('./routes/authRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Explicit import

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json()); // <--- Essential for parsing Login JSON body
app.use(express.urlencoded({ extended: true })); // Helps with form data

// Public Uploads Folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- ROUTES ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/verify', verifyRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health Check
app.get('/', (req, res) => {
    res.json({ status: 'active', system: 'EduAuth Registry API' });
});

module.exports = app;