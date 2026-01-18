const fs = require('fs')
const path = require('path')
const mediaModel = require('../models/mediaModel')
const Item = require('../models/itemModel')

// Directory for saving captured images
const CAPTURES_DIR = path.join(__dirname, '..', 'captures')
const PREFERENCES_DIR = path.join(__dirname, '..', 'preferences')
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts')
const DEFAULT_IMAGE_PROMPT_PATH = path.join(PROMPTS_DIR, 'gemini_image_base.txt')

function readBaseImagePrompt() {
  try {
    if (fs.existsSync(DEFAULT_IMAGE_PROMPT_PATH)) {
      const prompt = fs.readFileSync(DEFAULT_IMAGE_PROMPT_PATH, 'utf8').trim()
      if (prompt) return prompt
    }
  } catch (error) {
    console.warn('[GENERATE_PHOTO] Could not read base prompt file, using fallback:', error.message)
  }

  return 'Generate a stylized fashion photo of the person. Keep their identity, proportions, and features realistic while enhancing style, lighting, and overall quality. Avoid distortions. Use the provided context below to guide the outfit and vibe.'
}

async function getAvailableItems(overshootData) {
  try {
    const color = overshootData?.colour || overshootData?.color || ''
    const style = overshootData?.style || ''
    const item = overshootData?.item || ''

    const query = {}
    if (color) query.color = { $regex: color, $options: 'i' }
    if (style) query.style = style
    if (item) query.item = item

    const items = Object.keys(query).length > 0 ? await Item.find(query).limit(15) : await Item.find().limit(15)
    
    console.log('[GENERATE_PHOTO] Found', items.length, 'items from database')
    return items
  } catch (error) {
    console.warn('[GENERATE_PHOTO] Could not fetch items from database:', error.message)
    return []
  }
}

function formatItemsForPrompt(items) {
  if (!items || items.length === 0) {
    return 'No items available from database.'
  }

  return items
    .map((item, idx) => `${idx + 1}. ${item.item} - ${item.color} (${item.style}) - ${item.productLink}`)
    .join('\n')
}

// Ensure the captures directory exists
function ensureCapturesDir() {
  try {
    if (!fs.existsSync(CAPTURES_DIR)) {
      console.log('[CAPTURE] Creating captures directory:', CAPTURES_DIR)
      fs.mkdirSync(CAPTURES_DIR, { recursive: true })
      console.log('[CAPTURE] Captures directory created successfully')
    } else {
      console.log('[CAPTURE] Captures directory already exists:', CAPTURES_DIR)
    }
  } catch (error) {
    console.error('[CAPTURE] Error creating captures directory:', error)
    throw error
  }
}

/**
 * Save capture data (snapshot + Overshoot analysis)
 */
const saveCapture = async (req, res) => {
  try {
    console.log('[CAPTURE] Received save request:', { 
      hasSnapshot: !!req.body.snapshot, 
      hasOvershootData: !!req.body.overshootData,
      overshootData: req.body.overshootData 
    })
    const { snapshot, overshootData } = req.body

    if (!snapshot || !overshootData) {
      console.error('[CAPTURE] Validation failed: snapshot and overshootData are required')
      return res.status(400).json({ error: 'Snapshot and overshootData are required' })
    }

    console.log('[CAPTURE] Saving capture data...')
    ensureCapturesDir()

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `capture_${timestamp}.json`
    console.log('[CAPTURE] Generated filename:', filename)

    // Save snapshot image
    console.log('[CAPTURE] Processing snapshot image...')
    console.log('[CAPTURE] Snapshot data length:', snapshot?.length || 0)
    
    if (!snapshot || typeof snapshot !== 'string') {
      throw new Error('Invalid snapshot data: must be a string')
    }
    
    let base64Data
    try {
      base64Data = snapshot.replace(/^data:image\/\w+;base64,/, '')
      console.log('[CAPTURE] Base64 data length after cleanup:', base64Data.length)
    } catch (error) {
      console.error('[CAPTURE] Error processing snapshot string:', error)
      throw new Error('Failed to process snapshot data: ' + error.message)
    }
    
    let imageBuffer
    try {
      imageBuffer = Buffer.from(base64Data, 'base64')
      console.log('[CAPTURE] Image buffer created, size:', imageBuffer.length, 'bytes')
    } catch (error) {
      console.error('[CAPTURE] Error decoding base64:', error)
      throw new Error('Failed to decode base64 image data: ' + error.message)
    }
    
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Decoded image buffer is empty')
    }
    
    const imageFilename = `capture_${timestamp}.png`
    const imagePath = path.join(CAPTURES_DIR, imageFilename)
    
    try {
      fs.writeFileSync(imagePath, imageBuffer)
      console.log('[CAPTURE] Saved image file:', imagePath, `(${imageBuffer.length} bytes)`)
    } catch (error) {
      console.error('[CAPTURE] Error writing image file:', error)
      throw new Error('Failed to write image file: ' + error.message)
    }

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
    console.log('[CAPTURE] Saved JSON file:', dataPath)

    // Save as text file for Gemini processing
    const textFilename = `capture_${timestamp}.txt`
    const textPath = path.join(CAPTURES_DIR, textFilename)
    let textContent = 'Camera Capture Analysis:\n\n'
    textContent += `Image: ${imageFilename}\n`
    textContent += `Overshoot Analysis Data:\n`
    textContent += JSON.stringify(overshootData, null, 2)
    textContent += `\n\nSaved at: ${new Date().toISOString()}\n`
    fs.writeFileSync(textPath, textContent)
    console.log('[CAPTURE] Saved text file:', textPath)

    // Save as latest text file
    const latestTextPath = path.join(CAPTURES_DIR, 'latest.txt')
    fs.writeFileSync(latestTextPath, textContent)
    console.log('[CAPTURE] Saved latest text file:', latestTextPath)
    console.log('[CAPTURE] Save completed successfully')

    res.json({
      success: true,
      capture: captureData
    })

  } catch (error) {
    console.error('[CAPTURE] Error saving capture:', error)
    console.error('[CAPTURE] Error stack:', error.stack)
    res.status(500).json({ 
      error: 'Failed to save capture',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

/**
 * Generate photo using Gemini with text file + image
 */
const generatePhotoWithText = async (req, res) => {
  try {
    console.log('[GENERATE_PHOTO] Received generate request')
    ensureCapturesDir()

    // Read latest capture text file
    console.log('[GENERATE_PHOTO] Reading latest capture text file...')
    const latestCaptureTextPath = path.join(CAPTURES_DIR, 'latest.txt')
    let captureText = ''
    if (fs.existsSync(latestCaptureTextPath)) {
      captureText = fs.readFileSync(latestCaptureTextPath, 'utf8')
      console.log('[GENERATE_PHOTO] Read capture text:', captureText.substring(0, 100) + '...')
    } else {
      console.warn('[GENERATE_PHOTO] No capture text file found')
    }

    // Read latest preferences text file
    console.log('[GENERATE_PHOTO] Reading latest preferences text file...')
    const latestPreferencesTextPath = path.join(PREFERENCES_DIR, 'latest.txt')
    let preferencesText = ''
    if (fs.existsSync(latestPreferencesTextPath)) {
      preferencesText = fs.readFileSync(latestPreferencesTextPath, 'utf8')
      console.log('[GENERATE_PHOTO] Read preferences text:', preferencesText.substring(0, 100) + '...')
    } else {
      console.warn('[GENERATE_PHOTO] No preferences text file found')
    }

    // Get latest capture image
    console.log('[GENERATE_PHOTO] Finding latest capture image...')
    const files = fs.readdirSync(CAPTURES_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(CAPTURES_DIR, f),
        mtime: fs.statSync(path.join(CAPTURES_DIR, f)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime)

    if (files.length === 0) {
      console.error('[GENERATE_PHOTO] No capture files found')
      return res.status(400).json({ error: 'No capture image found. Please capture a photo first.' })
    }

    const latestFile = files[0]
    console.log('[GENERATE_PHOTO] Found latest capture file:', latestFile.name)
    const captureData = JSON.parse(fs.readFileSync(latestFile.path, 'utf8'))

    // Read the image
    if (!fs.existsSync(captureData.snapshotPath)) {
      console.error('[GENERATE_PHOTO] Image file not found:', captureData.snapshotPath)
      return res.status(400).json({ error: 'Capture image file not found' })
    }

    console.log('[GENERATE_PHOTO] Reading image from:', captureData.snapshotPath)
    const imageBuffer = fs.readFileSync(captureData.snapshotPath)
    const imageBase64 = imageBuffer.toString('base64')
    console.log('[GENERATE_PHOTO] Image loaded:', imageBuffer.length, 'bytes')

    // Fetch matching items from database
    console.log('[GENERATE_PHOTO] Fetching items from database...')
    const dbItems = await getAvailableItems(captureData.overshootData)
    const itemsText = formatItemsForPrompt(dbItems)

    // Combine text files into a prompt for Gemini
    console.log('[GENERATE_PHOTO] Creating prompt from text files...')
    const basePrompt = readBaseImagePrompt()
    let prompt = `${basePrompt}\n\n`
    
    if (preferencesText) {
      prompt += 'User Style Preferences:\n'
      prompt += preferencesText
      prompt += '\n'
    }
    
    if (captureText) {
      prompt += 'Camera Capture Analysis:\n'
      prompt += captureText
      prompt += '\n'
    }

    prompt += `\nAVAILABLE CLOTHING ITEMS FROM DATABASE:\n${itemsText}\n`
    
    prompt += '\nIMPORTANT: Choose clothing and accessories ONLY from the list above. Match items by number (e.g., "Use item #3 and item #7"). Include product links from your recommendations in your reasoning.\n'
    prompt += 'Use the context above to guide the outfit, styling, and vibe while keeping the person realistic and recognizable.'
    
    console.log('[GENERATE_PHOTO] Generated prompt length:', prompt.length, 'characters')
    console.log('[GENERATE_PHOTO] Prompt preview:', prompt.substring(0, 200) + '...')

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('[GENERATE_PHOTO] GEMINI_API_KEY is not configured')
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' })
    }

    // Generate image using Gemini editImage (image-to-image with text prompt)
    console.log('[GENERATE_PHOTO] Calling Gemini API to generate image...')
    const response = await mediaModel.editImage(
      prompt,
      imageBase64,
      'image/png',
      'gemini-3-pro-image-preview',
      null, // aspectRatio
      '2K'  // imageSize
    )
    console.log('[GENERATE_PHOTO] Received response from Gemini API')

    // Extract image from response
    const imagePart = response.candidates[0]?.content?.parts?.find(
      part => part.inlineData || part.imageData
    )

    if (!imagePart) {
      return res.status(500).json({ 
        error: 'No image generated in response',
        response: response 
      })
    }

    const generatedImageData = imagePart.inlineData?.data || imagePart.imageData?.data
    const mimeType = imagePart.inlineData?.mimeType || imagePart.imageData?.mimeType || 'image/png'

    if (!generatedImageData) {
      return res.status(500).json({ error: 'Image data not found in response' })
    }

    // Save generated image
    const timestamp = Date.now()
    const generatedImageFilename = `generated_${timestamp}.png`
    const generatedImagePath = path.join(CAPTURES_DIR, generatedImageFilename)
    const generatedImageBuffer = Buffer.from(generatedImageData, 'base64')
    fs.writeFileSync(generatedImagePath, generatedImageBuffer)
    console.log('[GENERATE_PHOTO] Saved generated image:', generatedImagePath, `(${generatedImageBuffer.length} bytes)`)
    console.log('[GENERATE_PHOTO] Generation completed successfully')

    // Return image as base64 data URL for frontend
    res.json({
      success: true,
      image: {
        data: generatedImageData,
        mimeType: mimeType,
        dataUrl: `data:${mimeType};base64,${generatedImageData}`,
        filename: generatedImageFilename,
        path: generatedImagePath
      },
      prompt: prompt
    })

  } catch (error) {
    console.error('[GENERATE_PHOTO] Error generating photo with text:', error)
    res.status(500).json({ 
      error: 'Failed to generate photo',
      message: error.message 
    })
  }
}

module.exports = {
  saveCapture,
  getLatestCapture,
  generatePhotoWithText
}
