#!/bin/bash

echo "Testing True Crime Narrator TTS Integration"
echo "============================================="

# Test 1: Fallback TTS
echo "🔧 Testing Fallback TTS..."
curl -s -X POST http://localhost:3000/api/generate-audio \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test of the fallback TTS system.", "voiceModelId": "fallback-narrator-1"}' | jq .

echo ""

# Test 2: Coqui TTS
echo "🎯 Testing Coqui TTS (Premium)..."
curl -s -X POST http://localhost:3000/api/generate-audio \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test of the premium Coqui TTS using Tacotron2.", "voiceModelId": "coqui-tacotron2"}' | jq .

echo ""

# Test 3: Check Python TTS Server directly
echo "🐍 Testing Python TTS Server directly..."
cd /workspaces/True-Crime/my-app
echo '{"text": "Direct Python test", "voice_model": "coqui-tacotron2"}' | /opt/conda/envs/tts-python311/bin/python python_tts_server.py

echo ""
echo "✅ TTS Integration Tests Complete"