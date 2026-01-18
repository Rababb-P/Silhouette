const express = require('express')
const router = express.Router()
const preferencesController = require('../controllers/preferencesController')

// Preferences routes
router.post('/preferences', preferencesController.savePreferences)
router.post('/preferences/style-vibe', preferencesController.saveStyleVibe)
router.get('/preferences/latest', preferencesController.getLatestPreferences)

module.exports = router
