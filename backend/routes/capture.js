const express = require('express')
const router = express.Router()
const captureController = require('../controllers/captureController')

// Capture routes
router.post('/capture', captureController.saveCapture)
router.get('/capture/latest', captureController.getLatestCapture)
router.post('/capture/generate-photo', captureController.generatePhotoWithText)

module.exports = router
