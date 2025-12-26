const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Middleware: Only allow 'admin' role
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admins only' });
    }
};

// --- DEFINED ROUTES ---
router.get('/pending', protect, adminOnly, adminController.getPendingUsers); // ?type=student/institution
router.get('/institutions', protect, adminOnly, adminController.getActiveInstitutions);
router.put('/approve/:userId', protect, adminOnly, adminController.approveUser);
router.put('/permission/:userId', protect, adminOnly, adminController.toggleIssuePermission);

module.exports = router;