const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const institutionController = require('../controllers/institutionController');

const router = express.Router();

router.post('/enroll', protect, authorize('institution'), institutionController.enrollStudent);
router.get('/students', protect, authorize('institution'), institutionController.getMyStudents);

module.exports = router;