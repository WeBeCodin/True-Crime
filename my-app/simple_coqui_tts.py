#!/usr/bin/env python3
"""
Simple Coqui TTS test script
"""

import sys
import json
import tempfile
from pathlib import Path

# Add conda env python path
sys.path.insert(0, "/opt/conda/envs/tts-python311/lib/python3.11/site-packages")

try:
    from TTS.api import TTS
    print(json.dumps({"status": "Coqui TTS imported successfully"}), file=sys.stderr)
except ImportError as e:
    print(json.dumps({"error": f"Coqui TTS import failed: {e}"}), file=sys.stderr)
    sys.exit(1)

def main():
    if len(sys.argv) != 4:
        print(json.dumps({"error": "Usage: script.py <text> <model> <output_path>"}))
        sys.exit(1)
    
    text = sys.argv[1]
    model_id = sys.argv[2]
    output_path = sys.argv[3]
    
    try:
        print(json.dumps({"status": f"Initializing TTS model: {model_id}"}), file=sys.stderr)
        
        # Map model names to actual Coqui models
        model_map = {
            'coqui-tacotron2': 'tts_models/en/ljspeech/tacotron2-DDC',
            'coqui-fastspeech2': 'tts_models/en/ljspeech/fastspeech2',
            'coqui-glow-tts': 'tts_models/en/ljspeech/glow-tts'
        }
        
        actual_model = model_map.get(model_id, 'tts_models/en/ljspeech/tacotron2-DDC')
        
        print(json.dumps({"status": f"Loading model: {actual_model}"}), file=sys.stderr)
        tts = TTS(actual_model)
        
        print(json.dumps({"status": f"Generating audio for: {text[:50]}..."}), file=sys.stderr)
        tts.tts_to_file(text=text, file_path=output_path)
        
        # Check if file was created
        if Path(output_path).exists():
            file_size = Path(output_path).stat().st_size
            result = {
                "success": True,
                "message": f"Audio generated successfully ({file_size} bytes)",
                "output_path": output_path
            }
        else:
            result = {
                "success": False,
                "message": "Audio file was not created"
            }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "message": f"TTS generation failed: {str(e)}"
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()