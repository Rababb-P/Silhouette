const express = require('express')
const router = express.Router()
const recommendationController = require('../controllers/recommendationController')

// Recommendation routes
router.post('/recommendation', recommendationController.generateRecommendation)

module.exports = router
