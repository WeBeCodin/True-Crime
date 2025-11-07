// Voice model options for TTS
export interface VoiceModel {
  id: string;
  name: string;
  description: string;
}

// Request interface for generating audio
export interface GenerateAudioRequest {
  text?: string;
  voiceModelId: string;
}

// Response interface for audio generation
export interface GenerateAudioResponse {
  success: boolean;
  audioUrl?: string;
  message?: string;
  error?: string;
}

// Text chunk for processing
export interface TextChunk {
  index: number;
  text: string;
}

// Available voice models
export const VOICE_MODELS: VoiceModel[] = [
  {
    id: "facebook/mms-tts-eng",
    name: "Narrator 1 - Clear",
    description: "Clear and professional English narrator"
  },
  {
    id: "facebook/fastspeech2-en-ljspeech",
    name: "Narrator 2 - Natural",
    description: "Natural and expressive voice"
  },
  {
    id: "espnet/kan-bayashi_ljspeech_vits",
    name: "Narrator 3 - Deep",
    description: "Deep and authoritative tone"
  }
];

// Configuration interface
export interface AppConfig {
  huggingFaceApiKey: string;
  port: number;
  maxChunkSize: number;
}
