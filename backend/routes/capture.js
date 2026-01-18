const express = require('express')
const router = express.Router()
const captureController = require('../controllers/captureController')

// Capture routes
router.post('/capture', captureController.saveCapture)
router.get('/capture/latest', captureController.getLatestCapture)

module.exports = router
