const express = require('express');
const verifyController = require('../controllers/verifyController');

const router = express.Router();

// GET /api/v1/verify/:hash
router.get('/:hash', verifyController.verifyCertificate);

module.exports = router;