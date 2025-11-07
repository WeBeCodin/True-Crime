#!/usr/bin/env python3
"""
Python TTS Server for True Crime Narrator
Handles Coqui TTS and KaniTTS generation for Node.js application
"""

import os
import sys
import json
import argparse
import tempfile
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Union

# Add conda env python path
CONDA_ENV_PATH = "/opt/conda/envs/tts-python311"
sys.path.insert(0, f"{CONDA_ENV_PATH}/lib/python3.11/site-packages")

try:
    from TTS.api import TTS
    COQUI_AVAILABLE = True
except ImportError:
    COQUI_AVAILABLE = False
    print("Warning: Coqui TTS not available", file=sys.stderr)

try:
    from kani_tts import KaniTTS
    KANI_AVAILABLE = True
except ImportError:
    KANI_AVAILABLE = False
    print("Info: KaniTTS not installed (removed to save disk space)", file=sys.stderr)


class CoquiTTSService:
    """Service for Coqui TTS generation"""
    
    def __init__(self):
        self.models = {}
        self.available_models = {
            'coqui-tacotron2': 'tts_models/en/ljspeech/tacotron2-DDC',
            'coqui-fastspeech2': 'tts_models/en/ljspeech/fastspeech2',
            'coqui-glow-tts': 'tts_models/en/ljspeech/glow-tts',
            'coqui-tacotron2-dca': 'tts_models/en/ljspeech/tacotron2-DCA',
            'coqui-speedy-speech': 'tts_models/en/ljspeech/speedy-speech'
        }
    
    def get_model(self, model_id: str) -> TTS:
        """Get or load TTS model"""
        if model_id not in self.models:
            if model_id not in self.available_models:
                raise ValueError(f"Unknown model: {model_id}")
            
            model_name = self.available_models[model_id]
            print(f"Loading Coqui model: {model_name}", file=sys.stderr)
            self.models[model_id] = TTS(model_name)
        
        return self.models[model_id]
    
    def generate_audio(self, text: str, model_id: str, output_path: str) -> bool:
        """Generate audio from text using Coqui TTS"""
        try:
            model = self.get_model(model_id)
            model.tts_to_file(text=text, file_path=output_path)
            return True
        except Exception as e:
            print(f"Coqui TTS generation failed: {e}", file=sys.stderr)
            return False


class KaniTTSService:
    """Service for KaniTTS generation"""
    
    def __init__(self):
        self.model = None
        self.available_speakers = [
            'david', 'puck', 'kore', 'andrew', 'jenny', 'simon', 'katie',
            'seulgi', 'bert', 'thorsten', 'maria', 'mei', 'ming', 'karim', 'nur'
        ]
    
    def get_model(self) -> KaniTTS:
        """Get or load KaniTTS model"""
        if self.model is None:
            print("Loading KaniTTS model: nineninesix/kani-tts-370m", file=sys.stderr)
            self.model = KaniTTS('nineninesix/kani-tts-370m')
        return self.model
    
    def generate_audio(self, text: str, speaker_id: str, output_path: str) -> bool:
        """Generate audio from text using KaniTTS"""
        try:
            model = self.get_model()
            if speaker_id not in self.available_speakers:
                speaker_id = 'andrew'  # Default speaker
            
            audio, _ = model(text, speaker_id=speaker_id)
            model.save_audio(audio, output_path)
            return True
        except Exception as e:
            print(f"KaniTTS generation failed: {e}", file=sys.stderr)
            return False


class PythonTTSServer:
    """Main TTS server handling both Coqui and KaniTTS"""
    
    def __init__(self):
        self.coqui_service = CoquiTTSService() if COQUI_AVAILABLE else None
        self.kani_service = KaniTTSService() if KANI_AVAILABLE else None
    
    def generate_audio(self, text: str, model_id: str, output_path: str) -> Dict[str, Union[bool, str]]:
        """Generate audio using appropriate TTS service"""
        result = {"success": False, "message": ""}
        
        try:
            # Determine service based on model_id prefix
            if model_id.startswith('coqui-'):
                if not self.coqui_service:
                    result["message"] = "Coqui TTS not available"
                    return result
                
                success = self.coqui_service.generate_audio(text, model_id, output_path)
                if success:
                    result["success"] = True
                    result["message"] = "Coqui TTS generation successful"
                else:
                    result["message"] = "Coqui TTS generation failed"
            
            elif model_id.startswith('kani-'):
                if not self.kani_service:
                    result["message"] = "KaniTTS not available"
                    return result
                
                # Extract speaker from model_id (e.g., 'kani-david' -> 'david')
                speaker_id = model_id.replace('kani-', '')
                success = self.kani_service.generate_audio(text, speaker_id, output_path)
                if success:
                    result["success"] = True
                    result["message"] = "KaniTTS generation successful"
                else:
                    result["message"] = "KaniTTS generation failed"
            
            else:
                result["message"] = f"Unknown model type: {model_id}"
            
        except Exception as e:
            result["message"] = f"TTS generation error: {str(e)}"
        
        return result
    
    def list_available_models(self) -> Dict[str, List[str]]:
        """List all available TTS models"""
        models = {
            "coqui": [],
            "kani": []
        }
        
        if self.coqui_service:
            models["coqui"] = list(self.coqui_service.available_models.keys())
        
        if self.kani_service:
            models["kani"] = [f"kani-{speaker}" for speaker in self.kani_service.available_speakers]
        
        return models


def main():
    """Main entry point for command line usage"""
    parser = argparse.ArgumentParser(description='Python TTS Server for True Crime Narrator')
    parser.add_argument('--text', required=True, help='Text to synthesize')
    parser.add_argument('--model', required=True, help='TTS model to use')
    parser.add_argument('--output', required=True, help='Output audio file path')
    parser.add_argument('--list-models', action='store_true', help='List available models')
    
    args = parser.parse_args()
    
    server = PythonTTSServer()
    
    if args.list_models:
        models = server.list_available_models()
        print(json.dumps(models, indent=2))
        return 0
    
    result = server.generate_audio(args.text, args.model, args.output)
    print(json.dumps(result))
    
    return 0 if result["success"] else 1


if __name__ == "__main__":
    sys.exit(main())