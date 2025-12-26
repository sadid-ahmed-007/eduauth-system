const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middlewares/authMiddleware');
const studentController = require('../controllers/studentController');

const router = express.Router();

// GET /api/v1/students/me/certificates
router.get('/me/certificates', protect, authorize('student'), studentController.getMyCertificates);
router.get('/me/profile', protect, authorize('student'), studentController.getMyProfile);
router.patch('/me/contact', protect, authorize('student'), studentController.updateMyContact);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.post(
    '/me/profile-request',
    protect,
    authorize('student'),
    upload.fields([
        { name: 'proofDocument', maxCount: 1 },
        { name: 'photo', maxCount: 1 }
    ]),
    studentController.submitProfileRequest
);

module.exports = router;
