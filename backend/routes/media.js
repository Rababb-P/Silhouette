const express = require('express')
const router = express.Router()
const mediaController = require('../controllers/mediaController')

// Video generation routes
router.post('/generate-video', mediaController.generateVideo)
router.post('/generate-video-info', mediaController.generateVideoInfo)

// Image generation routes
router.post('/generate-image', mediaController.generateImage)
router.post('/generate-image-info', mediaController.generateImageInfo)
router.post('/edit-image', mediaController.editImage)
router.post('/edit-image-info', mediaController.editImageInfo)

// Text generation routes
router.post('/generate-text', mediaController.generateText)
router.post('/generate-text-stream', mediaController.generateTextStream)

module.exports = router
