const express = require('express');
const multer = require('multer');
const path = require('path');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Configure Image Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save to 'uploads' folder
    },
    filename: (req, file, cb) => {
        // Rename file to avoid conflicts (e.g., "170668900-photo.jpg")
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Register Route (Now accepts a file named 'photo')
router.post('/register', upload.single('photo'), authController.register);

// Login Route (Unchanged)
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);

module.exports = router;
