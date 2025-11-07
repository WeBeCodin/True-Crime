#!/bin/bash

echo "🎙️ True Crime Narrator - Premium TTS Demo"
echo "=========================================="

# Demo script showing our premium TTS capabilities
cd /workspaces/True-Crime/my-app

echo "📝 Testing premium Coqui TTS generation..."
echo ""

# Test with true crime narrative sample
TEXT="In the quiet suburbs of Springfield, Detective Sarah Chen discovered something that would change everything. The evidence lay scattered across the abandoned warehouse floor, each piece telling a story of deception and betrayal that ran deeper than anyone could have imagined."

echo "🔊 Generating audio with Coqui Tacotron2..."
OUTPUT_FILE="/tmp/demo_$(date +%s).wav"

RESULT=$(/opt/conda/envs/tts-python311/bin/python simple_coqui_tts.py "$TEXT" "coqui-tacotron2" "$OUTPUT_FILE" 2>/dev/null)

if echo "$RESULT" | grep -q '"success": true'; then
    SIZE=$(echo "$RESULT" | jq -r '.message' | grep -o '[0-9]\+ bytes')
    echo "✅ SUCCESS: Generated premium TTS audio ($SIZE)"
    echo "📁 Output file: $OUTPUT_FILE"
    
    # Show file details
    if [ -f "$OUTPUT_FILE" ]; then
        echo "📊 Audio details:"
        ls -lh "$OUTPUT_FILE" | awk '{print "   Size: " $5}'
        file "$OUTPUT_FILE" | sed 's/^/   Format: /'
        echo ""
        echo "🎯 Premium TTS Integration: WORKING"
        echo "🚀 Ready for production use!"
    else
        echo "❌ Audio file not found"
    fi
else
    echo "❌ FAILED: $RESULT"
fi

echo ""
echo "🔧 Technical Details:"
echo "   Python Environment: /opt/conda/envs/tts-python311"
echo "   TTS Engine: Coqui TTS v0.22.0"
echo "   Model: tts_models/en/ljspeech/tacotron2-DDC"
echo "   Vocoder: vocoder_models/en/ljspeech/hifigan_v2"
echo ""
echo "✨ Next: Fix Node.js routing to enable web API access"