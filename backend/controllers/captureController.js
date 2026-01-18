const fs = require('fs')
const path = require('path')

// Directory for saving captured images
const CAPTURES_DIR = path.join(__dirname, '..', 'captures')

// Ensure the captures directory exists
function ensureCapturesDir() {
  if (!fs.existsSync(CAPTURES_DIR)) {
    fs.mkdirSync(CAPTURES_DIR, { recursive: true })
  }
}

/**
 * Save capture data (snapshot + Overshoot analysis)
 */
const saveCapture = async (req, res) => {
  try {
    const { snapshot, overshootData } = req.body

    if (!snapshot || !overshootData) {
      return res.status(400).json({ error: 'Snapshot and overshootData are required' })
    }

    ensureCapturesDir()

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `capture_${timestamp}.json`

    // Save snapshot image
    const base64Data = snapshot.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')
    const imageFilename = `capture_${timestamp}.png`
    const imagePath = path.join(CAPTURES_DIR, imageFilename)
    fs.writeFileSync(imagePath, imageBuffer)

    // Save capture data including image path
    const captureData = {
      timestamp,
      snapshotPath: imagePath,
      snapshotUrl: `/captures/${imageFilename}`,
      overshootData,
      createdAt: new Date().toISOString()
    }

    const dataPath = path.join(CAPTURES_DIR, filename)
    fs.writeFileSync(dataPath, JSON.stringify(captureData, null, 2))

    res.json({
      success: true,
      capture: captureData
    })

  } catch (error) {
    console.error('Error saving capture:', error)
    res.status(500).json({ 
      error: 'Failed to save capture',
      message: error.message 
    })
  }
}

/**
 * Get latest capture
 */
const getLatestCapture = async (req, res) => {
  try {
    ensureCapturesDir()

    // Read all capture files and get the latest
    const files = fs.readdirSync(CAPTURES_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(CAPTURES_DIR, f),
        mtime: fs.statSync(path.join(CAPTURES_DIR, f)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime)

    if (files.length === 0) {
      return res.status(404).json({ error: 'No captures found' })
    }

    const latestFile = files[0]
    const captureData = JSON.parse(fs.readFileSync(latestFile.path, 'utf8'))

    // Read image as base64
    if (fs.existsSync(captureData.snapshotPath)) {
      const imageBuffer = fs.readFileSync(captureData.snapshotPath)
      captureData.snapshot = `data:image/png;base64,${imageBuffer.toString('base64')}`
    }

    res.json({
      success: true,
      capture: captureData
    })

  } catch (error) {
    console.error('Error getting latest capture:', error)
    res.status(500).json({ 
      error: 'Failed to get latest capture',
      message: error.message 
    })
  }
}

module.exports = {
  saveCapture,
  getLatestCapture
}
