const fs = require('fs')
const path = require('path')

// Directory for saving preferences
const PREFERENCES_DIR = path.join(__dirname, '..', 'preferences')

// Ensure the preferences directory exists
function ensurePreferencesDir() {
  if (!fs.existsSync(PREFERENCES_DIR)) {
    fs.mkdirSync(PREFERENCES_DIR, { recursive: true })
  }
}

/**
 * Save user preferences (body part annotations)
 */
const savePreferences = async (req, res) => {
  try {
    const { preferences } = req.body

    if (!Array.isArray(preferences)) {
      return res.status(400).json({ error: 'Preferences must be an array' })
    }

    ensurePreferencesDir()

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `preferences_${timestamp}.json`

    // Save preferences
    const preferencesData = {
      timestamp,
      preferences,
      createdAt: new Date().toISOString()
    }

    const dataPath = path.join(PREFERENCES_DIR, filename)
    fs.writeFileSync(dataPath, JSON.stringify(preferencesData, null, 2))

    // Also save as latest preferences
    const latestPath = path.join(PREFERENCES_DIR, 'latest.json')
    fs.writeFileSync(latestPath, JSON.stringify(preferencesData, null, 2))

    res.json({
      success: true,
      preferences: preferencesData
    })

  } catch (error) {
    console.error('Error saving preferences:', error)
    res.status(500).json({ 
      error: 'Failed to save preferences',
      message: error.message 
    })
  }
}

/**
 * Get latest preferences
 */
const getLatestPreferences = async (req, res) => {
  try {
    ensurePreferencesDir()

    const latestPath = path.join(PREFERENCES_DIR, 'latest.json')
    
    if (!fs.existsSync(latestPath)) {
      return res.status(404).json({ error: 'No preferences found' })
    }

    const preferencesData = JSON.parse(fs.readFileSync(latestPath, 'utf8'))

    res.json({
      success: true,
      preferences: preferencesData
    })

  } catch (error) {
    console.error('Error getting latest preferences:', error)
    res.status(500).json({ 
      error: 'Failed to get latest preferences',
      message: error.message 
    })
  }
}

module.exports = {
  savePreferences,
  getLatestPreferences
}
