#!/bin/bash

# Test script for image generation using curl
# 
# Usage:
#   chmod +x test-image-curl.sh
#   ./test-image-curl.sh "your prompt here"
#
# Or set environment variables:
#   export SERVER_URL=http://localhost:3000
#   export PROMPT="A beautiful sunset over mountains"

SERVER_URL=${SERVER_URL:-"http://localhost:3000"}
PROMPT=${1:-"A beautiful sunset over a serene lake with mountains in the background, photorealistic, high quality"}

echo "🚀 Testing image generation with curl..."
echo "📍 Server: $SERVER_URL"
echo "📝 Prompt: \"$PROMPT\""
echo ""

# Test the info endpoint (returns JSON with base64 image)
echo "📡 Sending request to /api/generate-image-info..."
RESPONSE=$(curl -s -X POST "$SERVER_URL/api/generate-image-info" \
  -H "Content-Type: application/json" \
  -d "{
    \"prompt\": \"$PROMPT\",
    \"model\": \"gemini-2.5-flash-image\"
  }")

# Check if response contains success
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ Image generated successfully!"
  
  # Extract base64 data (this is simplified - for production use jq)
  echo "$RESPONSE" | python3 -c "
import sys
import json
import base64
from datetime import datetime

try:
    data = json.load(sys.stdin)
    if data.get('success') and data.get('image'):
        img_data = data['image']['data']
        mime_type = data['image']['mimeType']
        
        # Save image
        filename = f'test_image_{int(datetime.now().timestamp())}.png'
        with open(filename, 'wb') as f:
            f.write(base64.b64decode(img_data))
        
        print(f'💾 Image saved to: {filename}')
        print(f'📐 MIME Type: {mime_type}')
        if data.get('text'):
            print(f'📝 Text: {data[\"text\"]}')
    else:
        print('❌ Unexpected response format')
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f'❌ Error processing response: {e}')
    print('Raw response:', sys.stdin.read())
" 2>/dev/null || echo "❌ Failed to process response. Install Python 3 to decode image."
  
else
  echo "❌ Request failed"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
fi

echo ""
echo "💡 Tip: Use /api/generate-image to download the image directly as a file"
