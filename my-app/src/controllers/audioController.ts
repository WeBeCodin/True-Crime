import { TextChunkerService, HuggingFaceTTSService, AudioStitcherService } from '../services';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Controller for orchestrating text-to-speech audio generation
 */
export class AudioController {
  private textChunker: TextChunkerService;
  private ttsService: HuggingFaceTTSService;
  private audioStitcher: AudioStitcherService;

  constructor() {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
      throw new Error('HUGGINGFACE_API_KEY environment variable is not set');
    }

    const maxChunkSize = parseInt(process.env.MAX_CHUNK_SIZE || '500', 10);

    this.textChunker = new TextChunkerService(maxChunkSize);
    this.ttsService = new HuggingFaceTTSService(apiKey);
    this.audioStitcher = new AudioStitcherService();
  }

  /**
   * Main method to generate audio from text
   */
  public async generateAudio(
    text: string,
    voiceModelId: string
  ): Promise<{ audioPath: string; message: string }> {
    let audioFiles: string[] = [];

    try {
      console.log('Starting audio generation process...');
      console.log(`Text length: ${text.length} characters`);
      console.log(`Voice model: ${voiceModelId}`);

      // Step 1: Chunk the text
      console.log('Step 1: Chunking text...');
      const chunks = this.textChunker.chunkText(text);
      const stats = this.textChunker.getChunkStats(text);
      
      console.log(`Created ${stats.totalChunks} chunks`);
      console.log(`Average chunk size: ${stats.avgChunkSize} characters`);
      console.log(`Max chunk size: ${stats.maxChunkSize} characters`);

      // Step 2: Generate audio for each chunk
      console.log('Step 2: Generating audio for chunks...');
      audioFiles = await this.ttsService.generateAudioForChunks(
        chunks,
        voiceModelId,
        (current, total) => {
          console.log(`Progress: ${current}/${total} chunks completed`);
        }
      );

      console.log(`Generated ${audioFiles.length} audio files`);

      // Step 3: Stitch audio files together
      console.log('Step 3: Stitching audio files...');
      const finalAudioPath = await this.audioStitcher.stitchAudioFiles(audioFiles);

      console.log(`Final audio created: ${finalAudioPath}`);

      // Step 4: Clean up temporary files
      console.log('Step 4: Cleaning up temporary files...');
      this.ttsService.cleanupFiles(audioFiles);

      // Clean up old output files (older than 2 hours)
      this.audioStitcher.cleanupOldFiles(120);

      return {
        audioPath: finalAudioPath,
        message: `Successfully generated audio from ${text.length} characters in ${chunks.length} chunks`,
      };
    } catch (error) {
      console.error('Error in audio generation:', error);

      // Clean up any generated files on error
      if (audioFiles.length > 0) {
        this.ttsService.cleanupFiles(audioFiles);
      }

      throw error;
    }
  }

  /**
   * Get estimated processing time
   */
  public getEstimatedTime(text: string): { chunks: number; estimatedMinutes: number } {
    const chunks = this.textChunker.chunkText(text);
    // Rough estimate: 2 seconds per chunk + stitching time
    const estimatedSeconds = chunks.length * 2 + 10;
    const estimatedMinutes = Math.ceil(estimatedSeconds / 60);

    return {
      chunks: chunks.length,
      estimatedMinutes,
    };
  }
}
