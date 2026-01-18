const express = require('express');
const router = express.Router();
const multer = require('multer');
const styleController = require('../controllers/styleController');

// Configure multer for video upload
const upload = multer({ dest: 'uploads/' });

// Analyze style from video
router.post('/analyze-style', upload.single('video'), styleController.analyzeStyle);

module.exports = router;
