import { HfInference } from '@huggingface/inference';
import { TextChunk } from '../types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Service for generating speech from text using Hugging Face TTS models
 */
export class HuggingFaceTTSService {
  private hf: HfInference;
  private tempDir: string;

  constructor(apiKey: string) {
    this.hf = new HfInference(apiKey);
    this.tempDir = path.join(process.cwd(), 'temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Generate audio for a single text chunk
   */
  public async generateAudioForChunk(
    chunk: TextChunk,
    modelId: string
  ): Promise<string> {
    try {
      console.log(`Generating audio for chunk ${chunk.index}...`);
      
      // Call Hugging Face TTS API
      const response = await this.hf.textToSpeech({
        model: modelId,
        inputs: chunk.text
      });

      // Convert blob to buffer
      const buffer = Buffer.from(await response.arrayBuffer());
      
      // Save to temporary file
      const filename = `chunk_${chunk.index}.wav`;
      const filepath = path.join(this.tempDir, filename);
      
      fs.writeFileSync(filepath, buffer);
      
      console.log(`Chunk ${chunk.index} generated successfully`);
      return filepath;
    } catch (error) {
      console.error(`Error generating audio for chunk ${chunk.index}:`, error);
      throw new Error(`Failed to generate audio for chunk ${chunk.index}: ${error}`);
    }
  }

  /**
   * Generate audio for multiple chunks sequentially
   */
  public async generateAudioForChunks(
    chunks: TextChunk[],
    modelId: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<string[]> {
    const audioFiles: string[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const filepath = await this.generateAudioForChunk(chunk, modelId);
        audioFiles.push(filepath);
        
        if (onProgress) {
          onProgress(i + 1, chunks.length);
        }
        
        // Add a small delay between requests to avoid rate limiting
        if (i < chunks.length - 1) {
          await this.delay(1000); // 1 second delay
        }
      } catch (error) {
        console.error(`Failed to generate chunk ${i}:`, error);
        // Clean up any generated files before throwing
        this.cleanupFiles(audioFiles);
        throw error;
      }
    }
    
    return audioFiles;
  }

  /**
   * Clean up temporary audio files
   */
  public cleanupFiles(files: string[]): void {
    for (const file of files) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          console.log(`Cleaned up: ${file}`);
        }
      } catch (error) {
        console.error(`Error cleaning up file ${file}:`, error);
      }
    }
  }

  /**
   * Clean up all files in temp directory
   */
  public cleanupTempDirectory(): void {
    try {
      if (fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir);
        for (const file of files) {
          fs.unlinkSync(path.join(this.tempDir, file));
        }
        console.log('Temp directory cleaned up');
      }
    } catch (error) {
      console.error('Error cleaning up temp directory:', error);
    }
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get temp directory path
   */
  public getTempDir(): string {
    return this.tempDir;
  }
}
