import { TextChunk } from '../types';

/**
 * Service for intelligently splitting long text into manageable chunks
 * for TTS API processing. Splits at natural pauses to avoid awkward cuts.
 */
export class TextChunkerService {
  private maxChunkSize: number;

  constructor(maxChunkSize: number = 500) {
    this.maxChunkSize = maxChunkSize;
  }

  /**
   * Split text into chunks at natural boundaries (sentences, paragraphs)
   */
  public chunkText(text: string): TextChunk[] {
    const chunks: TextChunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;

    // Split by sentence endings (. ! ? followed by space or newline)
    const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      if (!trimmedSentence) continue;

      // If adding this sentence exceeds max size and we have content, save current chunk
      if (currentChunk.length + trimmedSentence.length > this.maxChunkSize && currentChunk.length > 0) {
        chunks.push({
          index: chunkIndex++,
          text: currentChunk.trim()
        });
        currentChunk = '';
      }

      // If a single sentence is too long, split it by commas or other punctuation
      if (trimmedSentence.length > this.maxChunkSize) {
        const subSentences = this.splitLongSentence(trimmedSentence);
        for (const subSentence of subSentences) {
          if (currentChunk.length + subSentence.length > this.maxChunkSize && currentChunk.length > 0) {
            chunks.push({
              index: chunkIndex++,
              text: currentChunk.trim()
            });
            currentChunk = '';
          }
          currentChunk += subSentence + ' ';
        }
      } else {
        currentChunk += trimmedSentence + ' ';
      }
    }

    // Add any remaining text as the final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        index: chunkIndex,
        text: currentChunk.trim()
      });
    }

    return chunks;
  }

  /**
   * Split a long sentence by commas and other natural pauses
   */
  private splitLongSentence(sentence: string): string[] {
    const parts: string[] = [];
    
    // Try splitting by commas first
    const commaParts = sentence.split(/,\s*/);
    
    for (const part of commaParts) {
      if (part.length > this.maxChunkSize) {
        // If still too long, split by words
        const words = part.split(/\s+/);
        let currentPart = '';
        
        for (const word of words) {
          if (currentPart.length + word.length + 1 > this.maxChunkSize && currentPart.length > 0) {
            parts.push(currentPart.trim());
            currentPart = '';
          }
          currentPart += word + ' ';
        }
        
        if (currentPart.trim().length > 0) {
          parts.push(currentPart.trim());
        }
      } else {
        parts.push(part.trim());
      }
    }
    
    return parts.filter(p => p.length > 0);
  }

  /**
   * Get statistics about the chunking
   */
  public getChunkStats(text: string): { totalChunks: number; avgChunkSize: number; maxChunkSize: number } {
    const chunks = this.chunkText(text);
    const chunkSizes = chunks.map(c => c.text.length);
    
    return {
      totalChunks: chunks.length,
      avgChunkSize: Math.round(chunkSizes.reduce((a, b) => a + b, 0) / chunks.length),
      maxChunkSize: Math.max(...chunkSizes)
    };
  }
}
