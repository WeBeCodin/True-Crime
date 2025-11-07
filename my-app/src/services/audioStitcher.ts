import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Service for concatenating multiple audio files into a single MP3
 */
export class AudioStitcherService {
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'output');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Stitch multiple audio files into a single MP3
   */
  public async stitchAudioFiles(audioFiles: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      if (audioFiles.length === 0) {
        reject(new Error('No audio files to stitch'));
        return;
      }

      const timestamp = Date.now();
      const outputFilename = `true_crime_audio_${timestamp}.mp3`;
      const outputPath = path.join(this.outputDir, outputFilename);

      console.log(`Stitching ${audioFiles.length} audio files...`);

      try {
        // Create a concat file list for ffmpeg
        const concatListPath = path.join(this.outputDir, `concat_${timestamp}.txt`);
        const concatList = audioFiles.map(file => `file '${file}'`).join('\n');
        fs.writeFileSync(concatListPath, concatList);

        // Use ffmpeg to concatenate audio files
        const command = ffmpeg();

        command
          .input(concatListPath)
          .inputOptions(['-f concat', '-safe 0'])
          .audioCodec('libmp3lame')
          .audioBitrate('128k')
          .audioFrequency(44100)
          .output(outputPath)
          .on('start', (commandLine: string) => {
            console.log('FFmpeg process started:', commandLine);
          })
          .on('progress', (progress: any) => {
            console.log(`Processing: ${progress.percent?.toFixed(2)}% done`);
          })
          .on('end', () => {
            console.log('Audio stitching completed successfully');
            
            // Clean up concat list file
            try {
              fs.unlinkSync(concatListPath);
            } catch (err) {
              console.error('Error deleting concat list:', err);
            }
            
            resolve(outputPath);
          })
          .on('error', (err: Error) => {
            console.error('Error stitching audio:', err);
            
            // Clean up concat list file
            try {
              fs.unlinkSync(concatListPath);
            } catch (cleanupErr) {
              console.error('Error deleting concat list:', cleanupErr);
            }
            
            reject(new Error(`Failed to stitch audio files: ${err.message}`));
          })
          .run();
      } catch (error) {
        console.error('Error setting up audio stitching:', error);
        reject(error);
      }
    });
  }

  /**
   * Alternative method: Stitch using simple merge (for WAV files)
   */
  public async stitchAudioFilesSimple(audioFiles: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      if (audioFiles.length === 0) {
        reject(new Error('No audio files to stitch'));
        return;
      }

      const timestamp = Date.now();
      const outputFilename = `true_crime_audio_${timestamp}.mp3`;
      const outputPath = path.join(this.outputDir, outputFilename);

      console.log(`Stitching ${audioFiles.length} audio files (simple mode)...`);

      const command = ffmpeg();

      // Add all input files
      audioFiles.forEach(file => {
        command.input(file);
      });

      command
        .on('start', (commandLine: string) => {
          console.log('FFmpeg process started:', commandLine);
        })
        .on('progress', (progress: any) => {
          console.log(`Processing: ${progress.percent?.toFixed(2)}% done`);
        })
        .on('end', () => {
          console.log('Audio stitching completed successfully');
          resolve(outputPath);
        })
        .on('error', (err: Error) => {
          console.error('Error stitching audio:', err);
          reject(new Error(`Failed to stitch audio files: ${err.message}`));
        })
        .mergeToFile(outputPath, this.outputDir);
    });
  }

  /**
   * Clean up old output files
   */
  public cleanupOldFiles(maxAgeMinutes: number = 60): void {
    try {
      if (fs.existsSync(this.outputDir)) {
        const files = fs.readdirSync(this.outputDir);
        const now = Date.now();
        
        for (const file of files) {
          const filepath = path.join(this.outputDir, file);
          const stats = fs.statSync(filepath);
          const fileAgeMinutes = (now - stats.mtimeMs) / (1000 * 60);
          
          if (fileAgeMinutes > maxAgeMinutes) {
            fs.unlinkSync(filepath);
            console.log(`Cleaned up old file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }
  }

  /**
   * Get output directory path
   */
  public getOutputDir(): string {
    return this.outputDir;
  }
}
