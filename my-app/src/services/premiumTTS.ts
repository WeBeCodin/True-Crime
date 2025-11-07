import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface PythonTTSResult {
  success: boolean;
  message: string;
}

interface TTSService {
  generateAudioForChunk(text: string, chunkIndex: number, outputDir: string): Promise<string>;
  cleanup?(): Promise<void>;
}

export class CoquiTTSService implements TTSService {
  private model: string;
  private pythonPath: string;
  private scriptPath: string;

  constructor(model: string = 'coqui-tacotron2') {
    this.model = model;
    this.pythonPath = '/opt/conda/envs/tts-python311/bin/python';
    this.scriptPath = path.join(process.cwd(), 'simple_coqui_tts.py');
  }

  async generateAudioForChunk(text: string, chunkIndex: number, outputDir: string): Promise<string> {
    const outputPath = path.join(outputDir, `chunk_${chunkIndex.toString().padStart(4, '0')}.wav`);
    
    try {
      console.log(`Generating Coqui TTS audio for chunk ${chunkIndex}...`);
      
      const result = await this.callPythonTTS(text, this.model, outputPath);
      
      if (!result.success) {
        throw new Error(`Coqui TTS failed: ${result.message}`);
      }
      
      // Verify file was created
      if (!fs.existsSync(outputPath)) {
        throw new Error('Audio file was not created');
      }
      
      console.log(`Coqui TTS chunk ${chunkIndex} generated successfully`);
      return outputPath;
      
    } catch (error) {
      console.error(`Coqui TTS error for chunk ${chunkIndex}:`, error);
      throw new Error(`Failed to generate Coqui TTS audio for chunk ${chunkIndex}: ${error}`);
    }
  }

  private async callPythonTTS(text: string, model: string, outputPath: string): Promise<PythonTTSResult> {
    return new Promise((resolve, reject) => {
      const args = [
        this.scriptPath,
        text,
        model,
        outputPath
      ];
      
      const python = spawn(this.pythonPath, args);
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
        // Log status messages from the Python script
        const lines = data.toString().split('\n').filter((line: string) => line.trim());
        lines.forEach((line: string) => {
          try {
            const statusMsg = JSON.parse(line);
            if (statusMsg.status) {
              console.log('Coqui TTS:', statusMsg.status);
            }
          } catch {
            // Non-JSON stderr output, just log it
            console.log('Coqui TTS:', line.trim());
          }
        });
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python TTS process failed with code ${code}: ${stderr}`));
          return;
        }
        
        try {
          const result = JSON.parse(stdout.trim()) as PythonTTSResult;
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse TTS result: ${parseError}`));
        }
      });
      
      python.on('error', (error) => {
        reject(new Error(`Failed to start Python TTS process: ${error}`));
      });
    });
  }

  async cleanup(): Promise<void> {
    // No specific cleanup needed for Coqui TTS
    console.log('Coqui TTS cleanup completed');
  }
}

export class KaniTTSService implements TTSService {
  private speaker: string;
  private pythonPath: string;
  private scriptPath: string;

  constructor(speaker: string = 'andrew') {
    this.speaker = speaker;
    this.pythonPath = '/opt/conda/envs/tts-python311/bin/python';
    this.scriptPath = path.join(process.cwd(), 'python_tts_server.py');
  }

  async generateAudioForChunk(text: string, chunkIndex: number, outputDir: string): Promise<string> {
    const outputPath = path.join(outputDir, `chunk_${chunkIndex.toString().padStart(4, '0')}.wav`);
    
    try {
      console.log(`Generating KaniTTS audio for chunk ${chunkIndex} with voice ${this.speaker}...`);
      
      const modelId = `kani-${this.speaker}`;
      const result = await this.callPythonTTS(text, modelId, outputPath);
      
      if (!result.success) {
        throw new Error(`KaniTTS failed: ${result.message}`);
      }
      
      // Verify file was created
      if (!fs.existsSync(outputPath)) {
        throw new Error('Audio file was not created');
      }
      
      console.log(`KaniTTS chunk ${chunkIndex} generated successfully`);
      return outputPath;
      
    } catch (error) {
      console.error(`KaniTTS error for chunk ${chunkIndex}:`, error);
      throw new Error(`Failed to generate KaniTTS audio for chunk ${chunkIndex}: ${error}`);
    }
  }

  private async callPythonTTS(text: string, model: string, outputPath: string): Promise<PythonTTSResult> {
    return new Promise((resolve, reject) => {
      const args = [
        this.scriptPath,
        '--text', text,
        '--model', model,
        '--output', outputPath
      ];
      
      const python = spawn(this.pythonPath, args);
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log('KaniTTS:', data.toString().trim()); // Log progress
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python TTS process failed with code ${code}: ${stderr}`));
          return;
        }
        
        try {
          const result = JSON.parse(stdout.trim()) as PythonTTSResult;
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse TTS result: ${parseError}`));
        }
      });
      
      python.on('error', (error) => {
        reject(new Error(`Failed to start Python TTS process: ${error}`));
      });
    });
  }

  async cleanup(): Promise<void> {
    // No specific cleanup needed for KaniTTS
    console.log('KaniTTS cleanup completed');
  }
}

// Export both services
export { TTSService };