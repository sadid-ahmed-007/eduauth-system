const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const studentController = require('../controllers/studentController');

const router = express.Router();

// GET /api/v1/students/me/certificates
router.get('/me/certificates', protect, studentController.getMyCertificates);

module.exports = router;