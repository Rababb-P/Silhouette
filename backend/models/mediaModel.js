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
 * Generate an image using Gemini Imagen API
 * @param {string} prompt - Text prompt for image generation
 * @param {string} model - Model to use (default: gemini-2.5-flash-image)
 * @param {string} aspectRatio - Aspect ratio
 * @param {string} imageSize - Image size: '1K', '2K', '4K'
 * @returns {Promise<Object>} Response object with generated image
 */
const generateImage = async (prompt, model = 'gemini-2.5-flash-image', aspectRatio = null, imageSize = null) => {
  const config = {
    responseModalities: ['Image', 'Text']
  }

  if (aspectRatio || imageSize) {
    config.imageConfig = {}
    if (aspectRatio) config.imageConfig.aspectRatio = aspectRatio
    if (imageSize) config.imageConfig.imageSize = imageSize
  }

  return await ai.models.generateContent({
    model: model,
    contents: [prompt],
    config: config
  })
}

module.exports = {
  generateVideoOperation,
  getVideoOperationStatus,
  downloadVideo,
  generateImage
}
