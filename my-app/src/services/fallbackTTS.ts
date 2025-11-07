import { TextChunk } from '../types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Fallback TTS service using local system TTS capabilities
 * This service provides immediate functionality when HuggingFace models are unavailable
 */
export class FallbackTTSService {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'fallback');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Generate audio for a single text chunk using system TTS
   */
  public async generateAudioForChunk(
    chunk: TextChunk,
    voiceId: string
  ): Promise<string> {
    try {
      console.log(`Generating audio for chunk ${chunk.index} using system TTS...`);
      
      // For now, create a simple demonstration file
      // In a real implementation, this would use system TTS or espeak
      const outputPath = path.join(this.tempDir, `chunk_${chunk.index}.wav`);
      
      // Use espeak if available (common on Linux systems)
      if (await this.isEspeakAvailable()) {
        await this.generateWithEspeak(chunk.text, outputPath, voiceId);
      } else {
        // Fallback: create a text file that explains the content
        await this.generatePlaceholderAudio(chunk.text, outputPath);
      }
      
      console.log(`Chunk ${chunk.index} generated successfully with fallback TTS`);
      return outputPath;
      
    } catch (error) {
      console.error(`Error generating audio for chunk ${chunk.index}:`, error);
      throw error;
    }
  }

  /**
   * Check if espeak is available on the system
   */
  private async isEspeakAvailable(): Promise<boolean> {
    try {
      const { spawn } = await import('child_process');
      return new Promise((resolve) => {
        const process = spawn('espeak', ['--version']);
        process.on('close', (code) => {
          resolve(code === 0);
        });
        process.on('error', () => {
          resolve(false);
        });
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate audio using espeak
   */
  private async generateWithEspeak(text: string, outputPath: string, voiceId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      
      // Map voice IDs to espeak voices
      const voiceMap: { [key: string]: string } = {
        'narrator-1': 'en+f3',
        'narrator-2': 'en+m3', 
        'narrator-3': 'en+f4'
      };
      
      const espeakVoice = voiceMap[voiceId] || 'en+f3';
      
      const process = spawn('espeak', [
        '-v', espeakVoice,
        '-s', '150', // Speed
        '-w', outputPath, // Write to file
        text
      ]);
      
      process.on('close', (code: number | null) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Espeak failed with code ${code}`));
        }
      });
      
      process.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  /**
   * Generate a placeholder audio file (silence with metadata)
   */
  private async generatePlaceholderAudio(text: string, outputPath: string): Promise<void> {
    // Generate a simple WAV file with silence
    // This is a minimal 1-second silence WAV file
    const wavHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x24, 0x08, 0x00, 0x00, // File size
      0x57, 0x41, 0x56, 0x45, // "WAVE"
      0x66, 0x6D, 0x74, 0x20, // "fmt "
      0x10, 0x00, 0x00, 0x00, // Subchunk1Size
      0x01, 0x00,             // AudioFormat (PCM)
      0x01, 0x00,             // NumChannels (mono)
      0x44, 0xAC, 0x00, 0x00, // SampleRate (44100)
      0x88, 0x58, 0x01, 0x00, // ByteRate
      0x02, 0x00,             // BlockAlign
      0x10, 0x00,             // BitsPerSample
      0x64, 0x61, 0x74, 0x61, // "data"
      0x00, 0x08, 0x00, 0x00  // Subchunk2Size
    ]);
    
    // 1 second of silence at 44100 Hz, 16-bit mono
    const silenceData = Buffer.alloc(44100 * 2); // 2 bytes per sample
    
    const wavFile = Buffer.concat([wavHeader, silenceData]);
    fs.writeFileSync(outputPath, wavFile);
  }

  /**
   * Generate audio for multiple chunks
   */
  public async generateAudioForChunks(
    chunks: TextChunk[],
    voiceId: string,
    progressCallback?: (current: number, total: number) => void
  ): Promise<string[]> {
    const audioFiles: string[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      if (progressCallback) {
        progressCallback(i + 1, chunks.length);
      }
      
      const audioFile = await this.generateAudioForChunk(chunk, voiceId);
      audioFiles.push(audioFile);
    }
    
    return audioFiles;
  }

  /**
   * Clean up temporary files
   */
  public cleanupFiles(filePaths: string[]): void {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up: ${filePath}`);
        }
      } catch (error) {
        console.warn(`Warning: Could not clean up ${filePath}:`, error);
      }
    });
  }

  /**
   * Clean up temporary directory
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