const { GoogleGenAI } = require('@google/genai')

// Initialize Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
})

/**
 * Generate a video using Gemini Veo API
 * @param {string} prompt - Text prompt for video generation
 * @param {string} model - Model to use (default: veo-3.1-generate-preview)
 * @param {string} aspectRatio - Aspect ratio: '16:9' or '9:16'
 * @returns {Promise<Object>} Operation object for video generation
 */
const generateVideoOperation = async (prompt, model = 'veo-3.1-generate-preview', aspectRatio = null) => {
  const requestOptions = {
    model: model,
    prompt: prompt,
  }

  if (aspectRatio) {
    requestOptions.aspectRatio = aspectRatio
  }

  return await ai.models.generateVideos(requestOptions)
}

/**
 * Check the status of a video generation operation
 * @param {Object} operation - Operation object
 * @returns {Promise<Object>} Updated operation object
 */
const getVideoOperationStatus = async (operation) => {
  return await ai.operations.getVideosOperation({
    operation: operation,
  })
}

/**
 * Download a generated video file
 * @param {Object} file - File object from generated video
 * @returns {Promise<Buffer>} Video buffer
 */
const downloadVideo = async (file) => {
  return await ai.files.download({
    file: file,
  })
}

/**
 * Generate an image using Gemini Nano Banana API (gemini-2.5-flash-image or gemini-3-pro-image-preview)
 * @param {string} prompt - Text prompt for image generation
 * @param {string} model - Model to use (default: gemini-3-pro-image-preview - Nano Banana Pro)
 * @param {string} aspectRatio - Aspect ratio (e.g., '1:1', '16:9', '9:16', '3:2', '2:3', '4:3', '3:4', '4:5', '5:4', '21:9')
 * @param {string} imageSize - Image size: '1K', '2K', '4K' (only for gemini-3-pro-image-preview)
 * @returns {Promise<Object>} Response object with generated image
 */
const generateImage = async (prompt, model = 'gemini-3-pro-image-preview', aspectRatio = null, imageSize = null) => {
  const requestOptions = {
    model: model,
    contents: prompt
  }

  // Add image configuration if aspectRatio or imageSize is provided
  if (aspectRatio || imageSize) {
    requestOptions.config = {
      imageConfig: {}
    }
    
    if (aspectRatio) {
      requestOptions.config.imageConfig.aspectRatio = aspectRatio
    }
    
    if (imageSize) {
      // imageSize is only valid for gemini-3-pro-image-preview
      requestOptions.config.imageConfig.imageSize = imageSize
    }
  }

  const response = await ai.models.generateContent(requestOptions)
  
  return response
}

/**
 * Edit an image using text prompt (text-and-image-to-image)
 * @param {string} prompt - Text prompt describing the edit
 * @param {Buffer|string} imageBuffer - Image buffer or base64 string
 * @param {string} mimeType - MIME type of the image (e.g., 'image/png', 'image/jpeg')
 * @param {string} model - Model to use (default: gemini-3-pro-image-preview - Nano Banana Pro)
 * @param {string} aspectRatio - Aspect ratio
 * @param {string} imageSize - Image size: '1K', '2K', '4K' (only for gemini-3-pro-image-preview)
 * @returns {Promise<Object>} Response object with generated image
 */
const editImage = async (prompt, imageBuffer, mimeType = 'image/png', model = 'gemini-3-pro-image-preview', aspectRatio = null, imageSize = null) => {
  // Convert image buffer to base64 if needed
  const imageBase64 = Buffer.isBuffer(imageBuffer) 
    ? imageBuffer.toString('base64')
    : imageBuffer

  const requestOptions = {
    model: model,
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType
            }
          },
          {
            text: prompt
          }
        ]
      }
    ]
  }

  // Add image configuration if aspectRatio or imageSize is provided
  if (aspectRatio || imageSize) {
    requestOptions.config = {
      imageConfig: {}
    }
    
    if (aspectRatio) {
      requestOptions.config.imageConfig.aspectRatio = aspectRatio
    }
    
    if (imageSize) {
      // imageSize is only valid for gemini-3-pro-image-preview
      requestOptions.config.imageConfig.imageSize = imageSize
    }
  }

  const response = await ai.models.generateContent(requestOptions)
  
  return response
}

/**
 * Generate text using Gemini API (standard text-to-text generation)
 * @param {string} prompt - Text prompt for text generation
 * @param {string} model - Model to use (default: gemini-2.0-flash-exp)
 * @param {Object} config - Optional generation config (temperature, maxTokens, etc.)
 * @returns {Promise<Object>} Response object with generated text
 */
const generateText = async (prompt, model = 'gemini-2.0-flash-exp', config = null) => {
  const requestOptions = {
    model: model,
    contents: prompt
  }

  // Add generation config if provided
  if (config) {
    requestOptions.config = config
  }

  const response = await ai.models.generateContent(requestOptions)
  
  return response
}

module.exports = {
  generateVideoOperation,
  getVideoOperationStatus,
  downloadVideo,
  generateImage,
  editImage,
  generateText
}
