const mediaModel = require('../models/mediaModel')
const fs = require('fs')
const path = require('path')

// Directory for saving generated media files
const GENERATED_MEDIA_DIR = path.join(__dirname, '..', 'generated-images')

// Ensure the generated media directory exists
function ensureGeneratedMediaDir() {
  if (!fs.existsSync(GENERATED_MEDIA_DIR)) {
    fs.mkdirSync(GENERATED_MEDIA_DIR, { recursive: true })
  }
}

// Helper function to handle API errors
const handleApiError = (error, res) => {
  console.error('API Error:', error)
  
  // Handle quota/rate limit errors (429)
  if (error.status === 429 || error.code === 429) {
    let errorMessage = 'Quota exceeded - Rate limit reached'
    let retryAfter = null
    
    // Try to parse the error message
    try {
      let errorDetails = error.message || error.details
      
      // If error.message is a JSON string, parse it
      if (typeof errorDetails === 'string') {
        try {
          errorDetails = JSON.parse(errorDetails)
        } catch (e) {
          // Not JSON, use as is
        }
      }
      
      if (errorDetails?.error) {
        const apiError = errorDetails.error
        errorMessage = apiError.message || errorMessage
        
        // Extract retry delay if available
        if (apiError.details) {
          const retryInfo = apiError.details.find(d => d['@type']?.includes('RetryInfo'))
          if (retryInfo?.retryDelay) {
            retryAfter = retryInfo.retryDelay.replace(/s$/, '') + ' seconds'
          }
        }
      }
    } catch (e) {
      // If parsing fails, use the original message
      errorMessage = error.message || errorMessage
    }
    
    return res.status(429).json({
      error: 'Quota exceeded',
      message: errorMessage.split('\n')[0], // Get first line for cleaner output
      retryAfter: retryAfter,
      suggestion: 'Your free tier quota has been exceeded. Please wait before retrying, or enable billing for higher limits. See https://ai.google.dev/gemini-api/docs/rate-limits'
    })
  }
  
  // Handle other errors
  const statusCode = error.status || error.code || 500
  return res.status(statusCode).json({ 
    error: 'API request failed',
    message: error.message || 'Unknown error occurred',
    status: statusCode
  })
}

/**
 * Generate and download video
 */
const generateVideo = async (req, res) => {
  try {
    const { prompt, aspectRatio, model = 'veo-3.1-generate-preview' } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' })
    }

    // Start video generation
    let operation = await mediaModel.generateVideoOperation(prompt, model, aspectRatio)

    // Poll the operation status until the video is ready
    const maxAttempts = 60 // Maximum 10 minutes (60 * 10 seconds)
    let attempts = 0

    while (!operation.done && attempts < maxAttempts) {
      console.log(`Waiting for video generation to complete... (attempt ${attempts + 1})`)
      await new Promise((resolve) => setTimeout(resolve, 10000)) // Wait 10 seconds
      operation = await mediaModel.getVideoOperationStatus(operation)
      attempts++
    }

    if (!operation.done) {
      return res.status(504).json({ 
        error: 'Video generation timed out',
        operationId: operation.name 
      })
    }

    if (operation.error) {
      return res.status(500).json({ 
        error: 'Video generation failed',
        details: operation.error 
      })
    }

    // Get the generated video
    const generatedVideo = operation.response.generatedVideos[0]
    
    if (!generatedVideo) {
      return res.status(500).json({ error: 'No video generated in response' })
    }

    // Download the video
    let videoBuffer
    try {
      videoBuffer = await mediaModel.downloadVideo(generatedVideo.video)
    } catch (apiError) {
      // If files API fails, try downloading directly from URI
      console.warn('⚠️  Files API failed:', apiError.message)
      console.warn('⚠️  Trying direct download from URI...')
      const videoUri = generatedVideo.video.uri || generatedVideo.video.name
      if (videoUri) {
        try {
          // Add API key to URI if not already present
          const uriWithKey = videoUri.includes('?') 
            ? `${videoUri}&key=${process.env.GEMINI_API_KEY}`
            : `${videoUri}?key=${process.env.GEMINI_API_KEY}`
          
          console.log('📥 Downloading from URI:', uriWithKey.substring(0, 100) + '...')
          const response = await fetch(uriWithKey, {
            headers: {
              'x-goog-api-key': process.env.GEMINI_API_KEY
            }
          })
          
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer()
            videoBuffer = Buffer.from(arrayBuffer)
            console.log('✅ Video downloaded directly from URI')
          } else {
            const errorText = await response.text()
            console.error('❌ Download failed:', response.status, errorText.substring(0, 200))
            throw new Error(`Failed to download from URI: ${response.status} - ${errorText.substring(0, 100)}`)
          }
        } catch (fetchError) {
          console.error('❌ Direct download also failed:', fetchError.message)
          throw fetchError
        }
      } else {
        throw apiError
      }
    }

    if (!videoBuffer) {
      return res.status(500).json({ 
        error: 'Failed to download video',
        message: 'Video buffer is undefined'
      })
    }

    // Ensure generated media directory exists
    ensureGeneratedMediaDir()

    // Generate filename based on prompt and timestamp
    const timestamp = Date.now()
    const safePrompt = prompt.slice(0, 50).replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const filename = `generated_${safePrompt}_${timestamp}.mp4`
    const filepath = path.join(GENERATED_MEDIA_DIR, filename)

    // Convert to Buffer if not already
    const buffer = Buffer.isBuffer(videoBuffer) ? videoBuffer : Buffer.from(videoBuffer)
    
    // Save video to disk
    fs.writeFileSync(filepath, buffer)
    console.log(`💾 Video saved to: ${filepath}`)

    // Send the video as a response
    res.set({
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length
    })

    res.send(buffer)

  } catch (error) {
    console.error('Error generating video:', error)
    res.status(500).json({ 
      error: 'Failed to generate video',
      message: error.message 
    })
  }
}

/**
 * Generate video and return metadata
 */
const generateVideoInfo = async (req, res) => {
  try {
    const { prompt, aspectRatio, model = 'veo-3.1-generate-preview' } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' })
    }

    let operation = await mediaModel.generateVideoOperation(prompt, model, aspectRatio)

    const maxAttempts = 60
    let attempts = 0

    while (!operation.done && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10000))
      operation = await mediaModel.getVideoOperationStatus(operation)
      attempts++
    }

    if (!operation.done) {
      return res.status(504).json({ 
        error: 'Video generation timed out',
        operationId: operation.name 
      })
    }

    if (operation.error) {
      return res.status(500).json({ 
        error: 'Video generation failed',
        details: operation.error 
      })
    }

    const generatedVideo = operation.response.generatedVideos[0]

    if (!generatedVideo) {
      return res.status(500).json({ error: 'No video generated in response' })
    }

    if (!generatedVideo.video) {
      return res.status(500).json({ 
        error: 'No video object in generated video response',
        generatedVideo: generatedVideo 
      })
    }

    // Download the video to save it locally
    let videoBuffer
    let filepath = null
    let filename = null
    
    try {
      // Try using the files API first
      try {
        videoBuffer = await mediaModel.downloadVideo(generatedVideo.video)
      } catch (apiError) {
        // If files API fails, try downloading directly from URI
        console.warn('⚠️  Files API failed:', apiError.message)
        console.warn('⚠️  Trying direct download from URI...')
        const videoUri = generatedVideo.video.uri || generatedVideo.video.name
        if (videoUri) {
          try {
            // Add API key to URI if not already present
            const uriWithKey = videoUri.includes('?') 
              ? `${videoUri}&key=${process.env.GEMINI_API_KEY}`
              : `${videoUri}?key=${process.env.GEMINI_API_KEY}`
            
            console.log('📥 Downloading from URI:', uriWithKey.substring(0, 100) + '...')
            const response = await fetch(uriWithKey, {
              headers: {
                'x-goog-api-key': process.env.GEMINI_API_KEY
              }
            })
            
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer()
              videoBuffer = Buffer.from(arrayBuffer)
              console.log('✅ Video downloaded directly from URI')
            } else {
              const errorText = await response.text()
              console.error('❌ Download failed:', response.status, errorText.substring(0, 200))
              throw new Error(`Failed to download from URI: ${response.status} - ${errorText.substring(0, 100)}`)
            }
          } catch (fetchError) {
            console.error('❌ Direct download also failed:', fetchError.message)
            throw fetchError
          }
        } else {
          throw apiError
        }
      }
      
      if (!videoBuffer) {
        console.warn('⚠️  Video buffer is undefined, skipping file save')
      } else {
        // Ensure generated media directory exists
        ensureGeneratedMediaDir()

        // Generate filename based on prompt and timestamp
        const timestamp = Date.now()
        const safePrompt = prompt.slice(0, 50).replace(/[^a-z0-9]/gi, '_').toLowerCase()
        filename = `generated_${safePrompt}_${timestamp}.mp4`
        filepath = path.join(GENERATED_MEDIA_DIR, filename)

        // Save video to disk
        fs.writeFileSync(filepath, videoBuffer)
        console.log(`💾 Video saved to: ${filepath}`)
      }
    } catch (downloadError) {
      console.error('⚠️  Error downloading/saving video:', downloadError.message)
      // Check if it's an API permission error
      if (downloadError.message.includes('SERVICE_DISABLED') || 
          downloadError.message.includes('PERMISSION_DENIED') ||
          downloadError.code === 403) {
        console.warn('ℹ️  Note: Generative Language API needs to be enabled in Google Cloud Console')
        console.warn('ℹ️  Visit: https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview')
        console.warn('ℹ️  Video URI is available but cannot be downloaded automatically without API enabled')
      }
      // Continue with response even if download fails - at least return the URI
    }

    // Return video metadata including local file path
    res.json({
      success: true,
      video: {
        uri: generatedVideo.video.uri || generatedVideo.video.name,
        name: generatedVideo.video.name,
        localPath: filepath,
        filename: filename,
        size: videoBuffer?.length || null,
        expiresIn: '2 days'
      },
      operation: {
        name: operation.name,
        done: operation.done
      }
    })

  } catch (error) {
    console.error('Error generating video:', error)
    res.status(500).json({ 
      error: 'Failed to generate video',
      message: error.message 
    })
  }
}

/**
 * Generate and download image
 */
const generateImage = async (req, res) => {
  try {
    const { prompt, model = 'gemini-3-pro-image-preview', aspectRatio, imageSize } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' })
    }

    // Generate image using Gemini API
    const response = await mediaModel.generateImage(prompt, model, aspectRatio, imageSize)

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

    // Get image data (base64 encoded)
    const imageData = imagePart.inlineData?.data || imagePart.imageData?.data
    const mimeType = imagePart.inlineData?.mimeType || imagePart.imageData?.mimeType || 'image/png'

    if (!imageData) {
      return res.status(500).json({ error: 'Image data not found in response' })
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData, 'base64')

    // Send image as response
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="generated_image_${Date.now()}.png"`,
      'Content-Length': imageBuffer.length
    })

    res.send(imageBuffer)

  } catch (error) {
    return handleApiError(error, res)
  }
}

/**
 * Generate image and return metadata
 */
const generateImageInfo = async (req, res) => {
  try {
    const { prompt, model = 'gemini-3-pro-image-preview', aspectRatio, imageSize } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' })
    }

    const response = await mediaModel.generateImage(prompt, model, aspectRatio, imageSize)

    const imagePart = response.candidates[0]?.content?.parts?.find(
      part => part.inlineData || part.imageData
    )

    if (!imagePart) {
      return res.status(500).json({ 
        error: 'No image generated in response',
        response: response 
      })
    }

    const imageData = imagePart.inlineData?.data || imagePart.imageData?.data
    const mimeType = imagePart.inlineData?.mimeType || imagePart.imageData?.mimeType || 'image/png'

    // Extract text if available
    const textParts = response.candidates[0]?.content?.parts?.filter(
      part => part.text
    )
    const text = textParts?.map(part => part.text).join(' ') || null

    // Return image as base64 data URL for easy use in frontend
    res.json({
      success: true,
      image: {
        data: imageData,
        mimeType: mimeType,
        dataUrl: `data:${mimeType};base64,${imageData}`
      },
      text: text
    })

  } catch (error) {
    return handleApiError(error, res)
  }
}

/**
 * Edit an image using text prompt
 */
const editImage = async (req, res) => {
  try {
    const { prompt, image, mimeType = 'image/png', model = 'gemini-3-pro-image-preview', aspectRatio, imageSize } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    if (!image) {
      return res.status(400).json({ error: 'Image is required' })
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' })
    }

    // Generate edited image using Gemini API
    const response = await mediaModel.editImage(prompt, image, mimeType, model, aspectRatio, imageSize)

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

    // Get image data (base64 encoded)
    const imageData = imagePart.inlineData?.data || imagePart.imageData?.data
    const responseMimeType = imagePart.inlineData?.mimeType || imagePart.imageData?.mimeType || 'image/png'

    if (!imageData) {
      return res.status(500).json({ error: 'Image data not found in response' })
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData, 'base64')

    // Send image as response
    res.set({
      'Content-Type': responseMimeType,
      'Content-Disposition': `attachment; filename="edited_image_${Date.now()}.png"`,
      'Content-Length': imageBuffer.length
    })

    res.send(imageBuffer)

  } catch (error) {
    return handleApiError(error, res)
  }
}

/**
 * Edit image and return metadata
 */
const editImageInfo = async (req, res) => {
  try {
    const { prompt, image, mimeType = 'image/png', model = 'gemini-3-pro-image-preview', aspectRatio, imageSize } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    if (!image) {
      return res.status(400).json({ error: 'Image is required' })
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' })
    }

    const response = await mediaModel.editImage(prompt, image, mimeType, model, aspectRatio, imageSize)

    const imagePart = response.candidates[0]?.content?.parts?.find(
      part => part.inlineData || part.imageData
    )

    if (!imagePart) {
      return res.status(500).json({ 
        error: 'No image generated in response',
        response: response 
      })
    }

    const imageData = imagePart.inlineData?.data || imagePart.imageData?.data
    const responseMimeType = imagePart.inlineData?.mimeType || imagePart.imageData?.mimeType || 'image/png'

    // Extract text if available
    const textParts = response.candidates[0]?.content?.parts?.filter(
      part => part.text
    )
    const text = textParts?.map(part => part.text).join(' ') || null

    // Return image as base64 data URL for easy use in frontend
    res.json({
      success: true,
      image: {
        data: imageData,
        mimeType: responseMimeType,
        dataUrl: `data:${responseMimeType};base64,${imageData}`
      },
      text: text
    })

  } catch (error) {
    return handleApiError(error, res)
  }
}

/**
 * Generate text from text prompt (standard text-to-text generation)
 */
const generateText = async (req, res) => {
  try {
    const { prompt, model = 'gemini-2.0-flash-exp', temperature, maxTokens, topP, topK } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' })
    }

    // Build generation config if any parameters are provided
    const config = {}
    if (temperature !== undefined) config.temperature = temperature
    if (maxTokens !== undefined) config.maxTokens = maxTokens
    if (topP !== undefined) config.topP = topP
    if (topK !== undefined) config.topK = topK

    const requestConfig = Object.keys(config).length > 0 ? config : null

    // Generate text using Gemini API
    const response = await mediaModel.generateText(prompt, model, requestConfig)

    // Extract text from response
    const textParts = response.candidates[0]?.content?.parts?.filter(
      part => part.text
    )

    if (!textParts || textParts.length === 0) {
      return res.status(500).json({ 
        error: 'No text generated in response',
        response: response 
      })
    }

    const generatedText = textParts.map(part => part.text).join(' ')

    // Return the generated text
    res.json({
      success: true,
      text: generatedText,
      model: model,
      usage: response.usageMetadata || null
    })

  } catch (error) {
    return handleApiError(error, res)
  }
}

/**
 * Generate text with streaming support (if needed in future)
 */
const generateTextStream = async (req, res) => {
  try {
    const { prompt, model = 'gemini-2.0-flash-exp', temperature, maxTokens } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' })
    }

    // Build generation config
    const config = {}
    if (temperature !== undefined) config.temperature = temperature
    if (maxTokens !== undefined) config.maxTokens = maxTokens

    const requestConfig = Object.keys(config).length > 0 ? config : null

    // Generate text
    const response = await mediaModel.generateText(prompt, model, requestConfig)

    // Extract text from response
    const textParts = response.candidates[0]?.content?.parts?.filter(
      part => part.text
    )

    if (!textParts || textParts.length === 0) {
      return res.status(500).json({ 
        error: 'No text generated in response',
        response: response 
      })
    }

    const generatedText = textParts.map(part => part.text).join(' ')

    // For now, return the full text (streaming can be implemented later)
    res.json({
      success: true,
      text: generatedText,
      model: model,
      usage: response.usageMetadata || null,
      note: 'Streaming not yet implemented, returns full text'
    })

  } catch (error) {
    return handleApiError(error, res)
  }
}

module.exports = {
  generateVideo,
  generateVideoInfo,
  generateImage,
  generateImageInfo,
  editImage,
  editImageInfo,
  generateText,
  generateTextStream
}
