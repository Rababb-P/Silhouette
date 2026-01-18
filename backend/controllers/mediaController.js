const mediaModel = require('../models/mediaModel')

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
    const videoBuffer = await mediaModel.downloadVideo(generatedVideo.video)

    // Send the video as a response
    res.set({
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="generated_video_${Date.now()}.mp4"`,
      'Content-Length': videoBuffer.length
    })

    res.send(Buffer.from(videoBuffer))

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

    // Return video metadata and download URL/info
    res.json({
      success: true,
      video: {
        uri: generatedVideo.video.uri || generatedVideo.video.name,
        name: generatedVideo.video.name,
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
    const { prompt, model = 'gemini-2.5-flash-image', aspectRatio, imageSize } = req.body

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
    const { prompt, model = 'gemini-2.5-flash-image', aspectRatio, imageSize } = req.body

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

module.exports = {
  generateVideo,
  generateVideoInfo,
  generateImage,
  generateImageInfo
}
