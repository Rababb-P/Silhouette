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
    console.log('[PREFERENCES] Received save request:', { body: req.body })
    const { preferences } = req.body

    if (!Array.isArray(preferences)) {
      console.error('[PREFERENCES] Validation failed: preferences must be an array')
      return res.status(400).json({ error: 'Preferences must be an array' })
    }

    console.log('[PREFERENCES] Saving preferences:', { count: preferences.length, preferences })
    ensurePreferencesDir()

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `preferences_${timestamp}.json`
    console.log('[PREFERENCES] Generated filename:', filename)

    // Save preferences
    const preferencesData = {
      timestamp,
      preferences,
      createdAt: new Date().toISOString()
    }

    const dataPath = path.join(PREFERENCES_DIR, filename)
    fs.writeFileSync(dataPath, JSON.stringify(preferencesData, null, 2))
    console.log('[PREFERENCES] Saved JSON file:', dataPath)

    // Also save as latest preferences
    const latestPath = path.join(PREFERENCES_DIR, 'latest.json')
    fs.writeFileSync(latestPath, JSON.stringify(preferencesData, null, 2))
    console.log('[PREFERENCES] Saved latest JSON:', latestPath)

    // Save as text file for Gemini processing
    const textFilename = `preferences_${timestamp}.txt`
    const textPath = path.join(PREFERENCES_DIR, textFilename)
    let textContent = 'User Style Preferences:\n\n'
    preferences.forEach((pref, index) => {
      textContent += `${index + 1}. Body Part: ${pref.bodyPart}\n`
      textContent += `   Comment: ${pref.comment}\n\n`
    })
    textContent += `Saved at: ${new Date().toISOString()}\n`
    fs.writeFileSync(textPath, textContent)
    console.log('[PREFERENCES] Saved text file:', textPath)

    // Save as latest text file
    const latestTextPath = path.join(PREFERENCES_DIR, 'latest.txt')
    fs.writeFileSync(latestTextPath, textContent)
    console.log('[PREFERENCES] Saved latest text file:', latestTextPath)
    console.log('[PREFERENCES] Save completed successfully')

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

/**
 * Save style vibe preference
 */
const saveStyleVibe = async (req, res) => {
  try {
    console.log('[STYLE_VIBE] Received save request:', { body: req.body })
    const { styleVibe } = req.body

    if (!styleVibe) {
      console.error('[STYLE_VIBE] Validation failed: styleVibe is required')
      return res.status(400).json({ error: 'Style vibe is required' })
    }

    console.log('[STYLE_VIBE] Saving style vibe:', styleVibe)
    ensurePreferencesDir()

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `style_vibe_${timestamp}.json`
    console.log('[STYLE_VIBE] Generated filename:', filename)

    // Save style vibe data
    const vibeData = {
      timestamp,
      styleVibe,
      createdAt: new Date().toISOString()
    }

    const dataPath = path.join(PREFERENCES_DIR, filename)
    fs.writeFileSync(dataPath, JSON.stringify(vibeData, null, 2))
    console.log('[STYLE_VIBE] Saved JSON file:', dataPath)

    // Also save as latest style vibe
    const latestPath = path.join(PREFERENCES_DIR, 'latest_style_vibe.json')
    fs.writeFileSync(latestPath, JSON.stringify(vibeData, null, 2))
    console.log('[STYLE_VIBE] Saved latest JSON:', latestPath)

    // Save as text file for Gemini processing
    const textFilename = `style_vibe_${timestamp}.txt`
    const textPath = path.join(PREFERENCES_DIR, textFilename)
    let textContent = `Selected Style Vibe: ${styleVibe}\n`
    textContent += `Saved at: ${new Date().toISOString()}\n`
    fs.writeFileSync(textPath, textContent)
    console.log('[STYLE_VIBE] Saved text file:', textPath)

    // Save as latest text file
    const latestTextPath = path.join(PREFERENCES_DIR, 'latest_style_vibe.txt')
    fs.writeFileSync(latestTextPath, textContent)
    console.log('[STYLE_VIBE] Saved latest text file:', latestTextPath)
    console.log('[STYLE_VIBE] Save completed successfully')

    res.json({
      success: true,
      styleVibe: vibeData
    })

  } catch (error) {
    console.error('Error saving style vibe:', error)
    res.status(500).json({ 
      error: 'Failed to save style vibe',
      message: error.message 
    })
  }
}

module.exports = {
  savePreferences,
  getLatestPreferences,
  saveStyleVibe
}
