const Item = require('../models/itemModel')
const mediaModel = require('../models/mediaModel')
const fs = require('fs')
const path = require('path')

// Directory paths
const CAPTURES_DIR = path.join(__dirname, '..', 'captures')
const PREFERENCES_DIR = path.join(__dirname, '..', 'preferences')
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts')
const DEFAULT_IMAGE_PROMPT_PATH = path.join(PROMPTS_DIR, 'gemini_image_base.txt')
const RECOMMENDATION_TEXT_PROMPT_PATH = path.join(PROMPTS_DIR, 'recommendation_text.txt')

function readBaseImagePrompt() {
  try {
    if (fs.existsSync(DEFAULT_IMAGE_PROMPT_PATH)) {
      const prompt = fs.readFileSync(DEFAULT_IMAGE_PROMPT_PATH, 'utf8').trim()
      if (prompt) return prompt
    }
  } catch (error) {
    console.warn('[RECOMMENDATION] Could not read base prompt file, using fallback:', error.message)
  }

  return 'Generate a stylized fashion photo. Keep the subject\'s identity, proportions, and features realistic while enhancing style, lighting, and overall quality. Avoid distortions.'
}

function readRecommendationTextPrompt() {
  try {
    if (fs.existsSync(RECOMMENDATION_TEXT_PROMPT_PATH)) {
      const prompt = fs.readFileSync(RECOMMENDATION_TEXT_PROMPT_PATH, 'utf8').trim()
      if (prompt) return prompt
    }
  } catch (error) {
    console.warn('[RECOMMENDATION] Could not read recommendation text prompt file, using fallback:', error.message)
  }

  return 'You are a fashion stylist. Recommend outfit items with links based on the user\'s style preferences.'
}

/**
 * Generate outfit recommendation using Gemini
 * New flow: Gemini analyzes user + full database -> picks items -> outputs recommendation text + links
 * Then uses that recommendation for image generation
 */
const generateRecommendation = async (req, res) => {
  try {
    console.log('[RECOMMENDATION] ✨ VERSION 2.0 - LINKS MODE ACTIVATED ✨')
    console.log('[RECOMMENDATION] NO database queries - Gemini recommends freely!')
    const { styleVibe, captureId, preferencesId } = req.body

    // Get latest capture data
    let captureData = null
    try {
      const captureFiles = fs.readdirSync(CAPTURES_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(CAPTURES_DIR, f),
          mtime: fs.statSync(path.join(CAPTURES_DIR, f)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime)

      if (captureFiles.length > 0) {
        captureData = JSON.parse(fs.readFileSync(captureFiles[0].path, 'utf8'))
        // Read snapshot image
        if (fs.existsSync(captureData.snapshotPath)) {
          const imageBuffer = fs.readFileSync(captureData.snapshotPath)
          captureData.snapshot = `data:image/png;base64,${imageBuffer.toString('base64')}`
        }
      }
    } catch (error) {
      console.warn('Could not load capture data:', error.message)
    }

    // Get latest preferences
    let preferences = []
    try {
      const latestPrefsPath = path.join(PREFERENCES_DIR, 'latest.json')
      if (fs.existsSync(latestPrefsPath)) {
        const prefsData = JSON.parse(fs.readFileSync(latestPrefsPath, 'utf8'))
        preferences = prefsData.preferences || []
      }
    } catch (error) {
      console.warn('Could not load preferences:', error.message)
    }

    // Extract Overshoot data
    const overshootData = captureData?.overshootData || {}
    const color = overshootData.colour || overshootData.color || 'versatile'
    const style = overshootData.style || 'formal'
    const item = overshootData.item || 'tops'

    // Map style vibes
    const vibeMap = {
      street: 'streetwear',
      formal: 'formal',
      sporty: 'active',
      manual: 'custom'
    }
    const targetStyle = vibeMap[styleVibe] || style

    // Build preference summary
    const preferenceSummary = preferences.length > 0
      ? preferences.map(p => `${p.bodyPart}: ${p.comment}`).join(', ')
      : 'No specific preferences'

    console.log('[RECOMMENDATION] Calling Gemini for outfit recommendations...')

    // Read the base prompt from template file
    const baseRecommendationPrompt = readRecommendationTextPrompt()
    
    // Create prompt for Gemini to recommend outfits with links
    const analysisPrompt = `${baseRecommendationPrompt}

User's Style:
• Color: ${color}
• Vibe: ${targetStyle}
• Focus: ${item}
• Preferences: ${preferenceSummary}

YOU MUST PROVIDE ONLY 1 SINGLE OUTFIT. NOT 2, NOT 3 - JUST 1.

Format EXACTLY:

🎯 THE LOOK
[One sentence]

✨ KEY PIECES (3-5 items)
1. [Item] - [Brand]
   [URL]

2. [Item] - [Brand]
   [URL]

3. [Item] - [Brand]
   [URL]

4. [Item] - [Brand]
   [URL]

5. [Item] - [Brand]
   [URL]

🎨 DESIGNER'S VISION
[2-3 sentences explaining your creative rationale in an artsy, fashion designer way. Why these pieces? What story do they tell? How do they elevate the wearer's presence?]

💡 STYLING TIP
[One sentence]

STOP AFTER THE FIRST OUTFIT. DO NOT CONTINUE.`

    try {
      console.log('[RECOMMENDATION] Starting Gemini API call with gemini-2.0-flash-exp...')
      const analysisResponse = await mediaModel.generateText(analysisPrompt, 'gemini-2.0-flash-exp')
      console.log('[RECOMMENDATION] Gemini API call completed')
      
      const analysisParts = analysisResponse.candidates[0]?.content?.parts?.filter(part => part.text)
      const recommendationText = analysisParts?.map(part => part.text).join('\n') || 'No recommendations generated'

      console.log('[RECOMMENDATION] Recommendation text generated, length:', recommendationText.length)

      // Extract links from recommendation text
      const linkMatches = recommendationText.match(/https?:\/\/[^\s\)]+/g) || []
      const uniqueLinks = [...new Set(linkMatches)]

      // Return the text recommendation with links
      res.json({
        success: true,
        version: '2.0-links-mode',
        textRecommendation: recommendationText,
        recommendedLinks: uniqueLinks,
        targetStyle: targetStyle,
        userPreferences: preferences,
        timestamp: new Date().toISOString()
      })
      
      console.log('[RECOMMENDATION] Response sent successfully!')
    } catch (geminiError) {
      console.error('[RECOMMENDATION] Gemini API error:', geminiError.message)
      res.status(500).json({ 
        error: 'Failed to generate recommendation',
        message: geminiError.message 
      })
    }

  } catch (error) {
    console.error('[RECOMMENDATION] Error generating recommendation:', error)
    res.status(500).json({ 
      error: 'Failed to generate recommendation',
      message: error.message 
    })
  }
}

/**
 * Generate photo image using recommendation text
 * Takes the recommendation text and generates a styled photo
 */
const generateRecommendationPhoto = async (req, res) => {
  try {
    const { recommendationText, styleVibe } = req.body

    if (!recommendationText) {
      return res.status(400).json({ error: 'recommendationText is required' })
    }

    // Get latest capture data for the photo to edit
    let captureData = null
    try {
      const captureFiles = fs.readdirSync(CAPTURES_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(CAPTURES_DIR, f),
          mtime: fs.statSync(path.join(CAPTURES_DIR, f)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime)

      if (captureFiles.length > 0) {
        captureData = JSON.parse(fs.readFileSync(captureFiles[0].path, 'utf8'))
        if (fs.existsSync(captureData.snapshotPath)) {
          const imageBuffer = fs.readFileSync(captureData.snapshotPath)
          captureData.snapshot = `data:image/png;base64,${imageBuffer.toString('base64')}`
        }
      }
    } catch (error) {
      console.warn('[PHOTO_GEN] Could not load capture data:', error.message)
      return res.status(400).json({ error: 'No capture photo available for editing' })
    }

    if (!captureData || !captureData.snapshot) {
      return res.status(400).json({ error: 'No capture photo available' })
    }

    // Get latest preferences
    let preferences = []
    try {
      const latestPrefsPath = path.join(PREFERENCES_DIR, 'latest.json')
      if (fs.existsSync(latestPrefsPath)) {
        const prefsData = JSON.parse(fs.readFileSync(latestPrefsPath, 'utf8'))
        preferences = prefsData.preferences || []
      }
    } catch (error) {
      console.warn('[PHOTO_GEN] Could not load preferences:', error.message)
    }

    // Extract Overshoot data
    const overshootData = captureData?.overshootData || {}
    const color = overshootData.colour || overshootData.color || 'versatile'
    const style = overshootData.style || 'formal'
    const item = overshootData.item || 'tops'

    // Map style vibes
    const vibeMap = {
      street: 'streetwear',
      formal: 'formal',
      sporty: 'active',
      manual: 'custom'
    }
    const targetStyle = vibeMap[styleVibe] || style

    // Build preference summary
    const preferenceSummary = preferences.length > 0
      ? preferences.map(p => `${p.bodyPart}: ${p.comment}`).join(', ')
      : 'No specific preferences'

    const basePrompt = readBaseImagePrompt()
    const base64Snapshot = captureData.snapshot.replace(/^data:image\/\w+;base64,/, '')
    const snapshotBuffer = Buffer.from(base64Snapshot, 'base64')

    // Use the recommendation text for image generation
    const imagePrompt = `${basePrompt}

User's Style Context:
• Selected Vibe: ${targetStyle}
• Preferred Color: ${color}
• Focus Area: ${item}
• Personal Preferences: ${preferenceSummary}

Transform this person into wearing the outfits described in this styling recommendation:

${recommendationText}

CRITICAL Requirements:
- DO NOT change frame, zoom, angle, or composition - keep EXACT same scale and framing
- DO NOT alter background, environment, lighting, or atmosphere
- ONLY change clothing and accessories to match the recommendation
- Keep the person's identity, face details, body proportions, and skin tone
- Apply the recommended clothing and accessories matching the ${targetStyle} style and ${color} color preference
- Maintain realistic, professional fashion photography style
- Avoid any distortions or artifacts`

    console.log('[PHOTO_GEN] Generating styled photo with Gemini...')
    const imageResponse = await mediaModel.editImage(
      imagePrompt,
      snapshotBuffer,
      'image/png',
      'gemini-3-pro-image-preview',
      '3:4',
      '2K'
    )

    // Extract image from response
    const imagePart = imageResponse.candidates[0]?.content?.parts?.find(
      part => part.inlineData || part.imageData
    )

    if (!imagePart) {
      throw new Error('No image data in Gemini response')
    }

    const imageData = imagePart.inlineData?.data || imagePart.imageData?.data
    const mimeType = imagePart.inlineData?.mimeType || imagePart.imageData?.mimeType || 'image/png'
    
    console.log('[PHOTO_GEN] Styled photo generated successfully')

    res.json({
      success: true,
      generatedPhoto: `data:${mimeType};base64,${imageData}`,
      description: recommendationText,
      style: targetStyle,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[PHOTO_GEN] Error generating photo:', error)
    res.status(500).json({ 
      error: 'Failed to generate photo',
      message: error.message 
    })
  }
}

module.exports = {
  generateRecommendation,
  generateRecommendationPhoto
}
