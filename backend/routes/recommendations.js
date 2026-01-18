const express = require('express')
const router = express.Router()
const recommendationController = require('../controllers/recommendationController')

// Recommendation routes
router.post('/recommendation', recommendationController.generateRecommendation)
router.post('/recommendation/photo', recommendationController.generateRecommendationPhoto)

module.exports = router
