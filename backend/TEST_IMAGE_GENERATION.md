# Testing Image Generation

This guide shows you how to test the image generation endpoints.

## Prerequisites

1. **Set up your API key** in `.env`:
   ```
   GEMINI_API_KEY=your_api_key_here
   PORT=3000
   ```

2. **Start your server**:
   ```bash
   npm start
   # or
   npm run dev
   ```

## Endpoints

### 1. `/api/generate-image` (POST)
Downloads the generated image directly as a file.

**Request body:**
```json
{
  "prompt": "A beautiful sunset over a serene lake with mountains in the background, photorealistic, high quality",
  "model": "gemini-2.5-flash-image",
  "aspectRatio": "16:9",
  "imageSize": "2K"
}
```

**Supported aspect ratios:** `1:1`, `3:2`, `2:3`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`

**Supported image sizes:** `1K`, `2K`, `4K`

**Response:** Binary image file (PNG)

### 2. `/api/generate-image-info` (POST)
Returns image metadata and base64-encoded image data.

**Request body:** Same as above

**Response:**
```json
{
  "success": true,
  "image": {
    "data": "base64_encoded_image_data",
    "mimeType": "image/png",
    "dataUrl": "data:image/png;base64,..."
  },
  "text": "Optional text response from the model"
}
```

## Testing Methods

### Method 1: Using Node.js Test Script

```bash
node test-image-generation.js "your prompt here"
```

This will:
- Generate an image
- Save it to a file in the current directory
- Display the results

### Method 2: Using curl Script

```bash
./test-image-curl.sh "your prompt here"
```

Make sure the script is executable:
```bash
chmod +x test-image-curl.sh
```

### Method 3: Using curl Directly

**Test the info endpoint:**
```bash
curl -X POST http://localhost:3000/api/generate-image-info \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic cityscape at sunset, cinematic lighting",
    "model": "gemini-2.5-flash-image",
    "aspectRatio": "16:9"
  }'
```

**Download image directly:**
```bash
curl -X POST http://localhost:3000/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful landscape"
  }' \
  --output generated_image.png
```

### Method 4: Using Postman or Thunder Client

1. Create a POST request to `http://localhost:3000/api/generate-image-info`
2. Set Content-Type header to `application/json`
3. Add body (raw JSON):
   ```json
   {
     "prompt": "A robot painting a landscape in watercolor style",
     "aspectRatio": "16:9"
   }
   ```
4. Send request
5. Copy the `dataUrl` from response and paste in browser to view image

## Example Prompts

- "A beautiful sunset over a serene lake with mountains in the background, photorealistic, high quality"
- "A futuristic cityscape at sunset, cinematic lighting"
- "A robot painting a landscape in watercolor style"
- "A majestic eagle soaring over snow-capped mountains, dramatic sky"
- "A cozy coffee shop interior with soft natural lighting, warm atmosphere"

## Troubleshooting

### Error: "GEMINI_API_KEY is not configured"
- Make sure you have a `.env` file in the backend directory
- Add `GEMINI_API_KEY=your_key_here` to the file

### Error: "Model not found" or 404
- Some models may not be available in all regions
- Try using `gemini-2.5-flash-image` or `gemini-3-pro-image-preview`
- Check that billing is enabled if required

### Error: "No image generated in response"
- Make sure your prompt is clear and requests an image
- Try adding "generate an image" or "create a picture" to your prompt
- Check the response object in the error details

### Slow Response
- Image generation can take 10-30 seconds
- This is normal for AI image generation

## Available Models

- `gemini-2.5-flash-image` - Recommended, fast and high quality
- `gemini-3-pro-image-preview` - Higher fidelity (preview)
