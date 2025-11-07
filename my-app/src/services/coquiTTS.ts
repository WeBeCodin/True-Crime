import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { TextChunk } from '../types';

/**
 * Service for generating speech using Coqui TTS models (local processing)
 * Provides higher quality voices and voice cloning capabilities
 */
export class CoquiTTSService {
  private tempDir: string;
  private pythonEnv: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'coqui');
    this.pythonEnv = process.env.COQUI_PYTHON_ENV || 'python3';
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Check if Coqui TTS is installed
   */
  public async checkInstallation(): Promise<boolean> {
    try {
      // First check Python version compatibility
      const pythonVersion = await this.checkPythonVersion();
      if (!this.isPythonCompatible(pythonVersion)) {
        console.warn(`Python ${pythonVersion} is not compatible with Coqui TTS (requires 3.9-3.11)`);
        return false;
      }

      return new Promise((resolve) => {
        const process = spawn(this.pythonEnv, ['-c', 'import TTS; print("OK")']);
        process.on('close', (code) => {
          resolve(code === 0);
        });
      });
    } catch (error) {
      console.warn('Error checking Coqui TTS installation:', error);
      return false;
    }
  }

  /**
   * Check Python version
   */
  private async checkPythonVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.pythonEnv, ['--version']);
      let output = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          const match = output.match(/Python (\d+\.\d+\.\d+)/);
          resolve(match ? match[1] : 'unknown');
        } else {
          reject(new Error('Failed to get Python version'));
        }
      });
    });
  }

  /**
   * Check if Python version is compatible with Coqui TTS
   */
  private isPythonCompatible(version: string): boolean {
    const [major, minor] = version.split('.').map(Number);
    
    // Coqui TTS requires Python 3.9.0 - 3.11.x
    if (major === 3) {
      return minor >= 9 && minor <= 11;
    }
    
    return false;
  }

  /**
   * Install Coqui TTS using pip
   */
  public async installCoquiTTS(): Promise<boolean> {
    try {
      // Check Python version compatibility first
      const pythonVersion = await this.checkPythonVersion();
      if (!this.isPythonCompatible(pythonVersion)) {
        throw new Error(`Python ${pythonVersion} is not compatible with Coqui TTS. Please use Python 3.9-3.11`);
      }

      return new Promise((resolve, reject) => {
        console.log('Installing Coqui TTS...');
        const process = spawn(this.pythonEnv, ['-m', 'pip', 'install', 'TTS'], {
          stdio: 'inherit'
        });
        
        process.on('close', (code) => {
          if (code === 0) {
            console.log('Coqui TTS installed successfully');
            resolve(true);
          } else {
            console.error('Failed to install Coqui TTS');
            reject(new Error(`Installation failed with code ${code}`));
          }
        });
      });
    } catch (error) {
      console.error('Installation error:', error);
      throw error;
    }
  }

  /**
   * Generate audio for a single text chunk using Coqui TTS
   */
  public async generateAudioForChunk(
    chunk: TextChunk,
    modelId: string,
    referenceAudio?: string,
    language?: string
  ): Promise<string> {
    try {
      console.log(`Generating audio for chunk ${chunk.index} using Coqui model ${modelId}...`);
      
      const outputPath = path.join(this.tempDir, `chunk_${chunk.index}.wav`);
      const pythonScript = this.createPythonScript(
        chunk.text,
        modelId,
        outputPath,
        referenceAudio,
        language
      );
      
      const scriptPath = path.join(this.tempDir, `script_${chunk.index}.py`);
      fs.writeFileSync(scriptPath, pythonScript);
      
      await this.runPythonScript(scriptPath);
      
      if (!fs.existsSync(outputPath)) {
        throw new Error(`Audio file not generated at ${outputPath}`);
      }
      
      console.log(`Audio generated successfully for chunk ${chunk.index}`);
      return outputPath;
      
    } catch (error) {
      console.error(`Error generating audio for chunk ${chunk.index}:`, error);
      throw error;
    }
  }

  /**
   * Create Python script for TTS generation
   */
  private createPythonScript(
    text: string,
    modelId: string,
    outputPath: string,
    referenceAudio?: string,
    language?: string
  ): string {
    const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    
    if (modelId === 'voice_clone_xtts' && referenceAudio) {
      // Voice cloning with XTTS
      return `
import torch
from TTS.api import TTS

# Initialize XTTS model for voice cloning
print("Loading XTTS model for voice cloning...")
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")

# Generate speech with voice cloning
print("Generating speech with voice cloning...")
tts.tts_to_file(
    text="${escapedText}",
    speaker_wav="${referenceAudio}",
    language="${language || 'en'}",
    file_path="${outputPath}",
    split_sentences=True
)
print("Voice cloning completed successfully!")
`;
    } else {
      // Standard TTS models
      return `
import torch
from TTS.api import TTS

# Initialize TTS model
print("Loading model: ${modelId}")
tts = TTS("${modelId}")

# Generate speech
print("Generating speech...")
tts.tts_to_file(
    text="${escapedText}",
    file_path="${outputPath}",
    split_sentences=True
)
print("Speech generation completed successfully!")
`;
    }
  }

  /**
   * Run Python script and wait for completion
   */
  private async runPythonScript(scriptPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.pythonEnv, [scriptPath], {
        stdio: 'inherit'
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python script failed with code ${code}`));
        }
      });
      
      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * List available Coqui TTS models
   */
  public async getAvailableModels(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const pythonScript = `
from TTS.api import TTS
print("Available models:")
models = TTS.list_models()
for model in models:
    print(model)
`;
      
      const scriptPath = path.join(this.tempDir, 'list_models.py');
      fs.writeFileSync(scriptPath, pythonScript);
      
      let output = '';
      const process = spawn(this.pythonEnv, [scriptPath]);
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          const models = output.split('\n')
            .filter(line => line.startsWith('tts_models/'))
            .map(line => line.trim());
          resolve(models);
        } else {
          reject(new Error(`Failed to list models with code ${code}`));
        }
      });
    });
  }

  /**
   * Clean up temporary files
   */
  public cleanup(): void {
    try {
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('Warning: Could not clean up temp directory:', error);
    }
  }
}