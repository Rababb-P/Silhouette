/**
 * Test script for image generation endpoint
 * 
 * Usage:
 *   node test-image-generation.js
 * 
 * Make sure your server is running and GEMINI_API_KEY is set in .env
 */

const http = require('http');
const fs = require('fs');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const ENDPOINT = '/api/generate-image-info'; // Change to '/api/generate-image' to download file

const testPrompt = process.argv[2] || 'A beautiful sunset over a serene lake with mountains in the background, photorealistic, high quality';

console.log('🚀 Testing image generation...');
console.log(`📍 Server: ${SERVER_URL}`);
console.log(`📝 Prompt: "${testPrompt}"`);
console.log('');

const postData = JSON.stringify({
  prompt: testPrompt,
  model: 'gemini-2.5-flash-image' // Optional: defaults to gemini-2.5-flash-image
});

const options = {
  hostname: SERVER_URL.replace('http://', '').replace('https://', '').split(':')[0],
  port: SERVER_URL.includes(':') ? SERVER_URL.split(':').pop().replace('/', '') : 3000,
  path: ENDPOINT,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';

  console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);

  if (res.statusCode !== 200) {
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const error = JSON.parse(data);
        console.error('❌ Error:', error);
      } catch (e) {
        console.error('❌ Error:', data);
      }
    });
    return;
  }

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.success) {
        console.log('✅ Image generated successfully!');
        console.log(`📐 MIME Type: ${response.image.mimeType}`);
        console.log(`📝 Text response: ${response.text || 'None'}`);
        
        // Save image to file
        const imageBuffer = Buffer.from(response.image.data, 'base64');
        const filename = `test_image_${Date.now()}.png`;
        fs.writeFileSync(filename, imageBuffer);
        console.log(`💾 Image saved to: ${filename}`);
      } else {
        console.error('❌ Generation failed:', response);
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.log('Raw response:', data.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  console.log('💡 Make sure your server is running on', SERVER_URL);
});

req.write(postData);
req.end();
