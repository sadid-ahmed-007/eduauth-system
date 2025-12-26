const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware'); // <--- Ensure both are imported
const certificateController = require('../controllers/certificateController');

const router = express.Router();

// Route to Issue Certificate (Only Institutions)
router.post('/issue', 
    protect, 
    authorize('institution'), // <--- If authorize is undefined, this crashes
    certificateController.issueCertificate
);

// Route to View My Certificates (Only Students)
router.get('/me', 
    protect, 
    authorize('student'), 
    certificateController.getMyCertificates
);

module.exports = router;