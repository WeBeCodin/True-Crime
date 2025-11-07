export interface VoiceModel {
  id: string;
  name: string;
  description: string;
  provider: "huggingface" | "coqui" | "kani" | "fallback";
  category?: "standard" | "premium" | "voice-clone";
  languages?: string[];
  requiresReference?: boolean;
}

export interface GenerateAudioRequest {
  text?: string;
  voiceModelId: string;
  referenceAudio?: string;
}

export interface GenerateAudioResponse {
  success: boolean;
  audioUrl?: string;
  message?: string;
  error?: string;
}

export interface TextChunk {
  index: number;
  text: string;
}

export const VOICE_MODELS: VoiceModel[] = [
  {
    id: "fallback-narrator-1",
    name: "Narrator 1 - Clear",
    description: "Clear and professional system voice (always available)",
    provider: "fallback",
    category: "standard"
  },
  {
    id: "coqui-tacotron2",
    name: "Professional Narrator",
    description: "High-quality professional narrator using Tacotron2",
    provider: "coqui",
    category: "premium",
    languages: ["en"]
  }
];

export interface AppConfig {
  huggingFaceApiKey: string;
  port: number;
  maxChunkSize: number;
}