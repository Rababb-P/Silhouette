const Item = require('../models/itemModel')
const mediaModel = require('../models/mediaModel')
const fs = require('fs')
const path = require('path')

// Directory paths
const CAPTURES_DIR = path.join(__dirname, '..', 'captures')
const PREFERENCES_DIR = path.join(__dirname, '..', 'preferences')

/**
 * Generate outfit recommendation using Gemini
 */
const generateRecommendation = async (req, res) => {
  try {
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

    if (!captureData) {
      return res.status(400).json({ error: 'No capture data found. Please capture an image first.' })
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
    const overshootData = captureData.overshootData || {}
    const color = overshootData.colour || overshootData.color || 'unknown'
    const style = overshootData.style || 'formal'
    const item = overshootData.item || 'tops'

    // Query database for matching clothing items
    const matchingItems = await Item.find({
      $or: [
        { color: { $regex: color, $options: 'i' } },
        { style: style },
        { item: item }
      ]
    }).limit(10)

    console.log(`Found ${matchingItems.length} matching items in database`)

    // Build preference summary
    const preferenceSummary = preferences
      .map(p => `${p.bodyPart}: ${p.comment}`)
      .join(', ')

    // Map style vibes
    const vibeMap = {
      street: 'streetwear',
      formal: 'formal',
      sporty: 'active',
      manual: 'custom'
    }
    const targetStyle = vibeMap[styleVibe] || style

    // Build Gemini prompt for recommendation
    const itemDescriptions = matchingItems
      .map(item => `- ${item.item} (${item.color}, ${item.style}): ${item.productLink}`)
      .join('\n')

    const recommendationPrompt = `You are a fashion stylist. Analyze this person's photo and provide outfit recommendations.

CURRENT ANALYSIS:
- Color: ${color}
- Style: ${style}
- Item: ${item}

AVAILABLE CLOTHING ITEMS:
${itemDescriptions || 'No matching items found'}

USER PREFERENCES:
${preferenceSummary || 'No specific preferences'}

TARGET STYLE: ${targetStyle}

TASK:
1. Recommend specific outfits from the available items that would look great on this person
2. Consider their body type, current style (${style}), and preferences
3. Match the target style vibe: ${targetStyle}
4. Provide 2-3 outfit recommendations with reasoning

Format your response as JSON:
{
  "recommendations": [
    {
      "name": "Outfit name",
      "description": "Why this outfit works",
      "items": ["item URL 1", "item URL 2"],
      "style": "${targetStyle}"
    }
  ]
}`

    // Generate text recommendation
    const textResponse = await mediaModel.generateText(recommendationPrompt, 'gemini-2.0-flash-exp')
    const textParts = textResponse.candidates[0]?.content?.parts?.filter(part => part.text)
    const recommendationText = textParts?.map(part => part.text).join(' ') || ''

    // Parse JSON from response
    let recommendations = []
    try {
      const jsonMatch = recommendationText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        recommendations = parsed.recommendations || []
      }
    } catch (parseError) {
      console.warn('Could not parse recommendations JSON:', parseError)
    }

    // Generate images for each recommendation
    const generatedImages = []
    const base64Snapshot = captureData.snapshot.replace(/^data:image\/\w+;base64,/, '')
    const snapshotBuffer = Buffer.from(base64Snapshot, 'base64')

    for (let i = 0; i < Math.min(recommendations.length, 2); i++) {
      const rec = recommendations[i]
      
      // Build image generation prompt
      const imagePrompt = `Transform this person into wearing ${targetStyle} style outfit. 
Outfit details: ${rec.description || 'stylish outfit'}
Style: ${targetStyle}
Make it look realistic and fashionable. Keep the person's face and body proportions the same.`

      try {
        // Use editImage to modify the snapshot
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

        if (imagePart) {
          const imageData = imagePart.inlineData?.data || imagePart.imageData?.data
          const mimeType = imagePart.inlineData?.mimeType || imagePart.imageData?.mimeType || 'image/png'
          
          generatedImages.push({
            name: rec.name || `Outfit ${i + 1}`,
            description: rec.description || '',
            dataUrl: `data:${mimeType};base64,${imageData}`,
            items: rec.items || [],
            style: rec.style || targetStyle
          })
        }
      } catch (imageError) {
        console.error(`Failed to generate image for recommendation ${i + 1}:`, imageError)
        // Continue with other recommendations
      }
    }

    res.json({
      success: true,
      recommendations: recommendations,
      generatedImages: generatedImages,
      textRecommendation: recommendationText,
      matchingItems: matchingItems.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating recommendation:', error)
    res.status(500).json({ 
      error: 'Failed to generate recommendation',
      message: error.message 
    })
  }
}

module.exports = {
  generateRecommendation
}
