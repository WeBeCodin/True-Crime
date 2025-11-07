# True Crime Narrator - Text-to-Speech App

A web application that converts long-form text (scripts, transcripts, novels) into high-quality audio files using Hugging Face's Text-to-Speech AI models.

## Features

- 📝 **Text Input**: Paste text directly or upload `.txt` files
- 🎙️ **Multiple Voices**: Choose from curated AI voices for different tones
- ✂️ **Smart Text Chunking**: Automatically splits long texts at natural pauses
- 🔗 **Audio Stitching**: Combines multiple audio chunks into a single MP3 file
- 🎧 **In-Browser Preview**: Listen to the generated audio before downloading
- ⬇️ **Easy Download**: Save the final audio file to your computer

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **AI/ML**: Hugging Face Inference API
- **Audio Processing**: FFmpeg (via fluent-ffmpeg)
- **Frontend**: Vanilla HTML/CSS/JavaScript

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **FFmpeg** installed on your system
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt-get install ffmpeg`
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
- **Hugging Face API Key**: Get one free at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your Hugging Face API key:
   ```env
   HUGGINGFACE_API_KEY=your_actual_api_key_here
   PORT=3000
   MAX_CHUNK_SIZE=500
   ```

## Usage

### Development Mode

Start the development server with auto-reload:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Production Mode

Build and run in production:

```bash
npm run build
npm start
```

## How It Works

1. **Text Input**: User provides text via textarea or file upload
2. **Text Chunking**: The `TextChunkerService` intelligently splits the text into chunks (default: 500 characters) at natural boundaries (sentences, paragraphs)
3. **TTS Generation**: The `HuggingFaceTTSService` sends each chunk to Hugging Face's TTS API sequentially
4. **Audio Stitching**: The `AudioStitcherService` uses FFmpeg to concatenate all audio chunks into a single MP3
5. **Download**: User can preview and download the final audio file

## Project Structure

```
my-app/
├── src/
│   ├── controllers/
│   │   └── audioController.ts    # Orchestrates the TTS pipeline
│   ├── services/
│   │   ├── textChunker.ts        # Smart text splitting
│   │   ├── huggingFaceTTS.ts     # Hugging Face API integration
│   │   └── audioStitcher.ts      # FFmpeg audio concatenation
│   ├── routes/
│   │   └── index.ts              # API endpoints
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   ├── app.ts                    # Express app configuration
│   └── index.ts                  # Server entry point
├── public/
│   ├── index.html                # Frontend UI
│   ├── styles.css                # Styling
│   └── app.js                    # Frontend logic
├── package.json
├── tsconfig.json
└── .env.example
```

## API Endpoints

### `GET /api/voices`
Returns available voice models.

**Response:**
```json
{
  "success": true,
  "voices": [
    {
      "id": "facebook/mms-tts-eng",
      "name": "Narrator 1 - Clear",
      "description": "Clear and professional English narrator"
    }
  ]
}
```

### `POST /api/generate-audio`
Generate audio from text.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `text` (string, optional): Text to convert
  - `textFile` (file, optional): .txt file to convert
  - `voiceModelId` (string, required): Voice model ID

**Response:**
```json
{
  "success": true,
  "audioUrl": "/audio/true_crime_audio_1234567890.mp3",
  "message": "Successfully generated audio from 5000 characters in 10 chunks"
}
```

### `GET /api/health`
Health check endpoint.

## Configuration

### Environment Variables

- `HUGGINGFACE_API_KEY`: Your Hugging Face API token (required)
- `PORT`: Server port (default: 3000)
- `MAX_CHUNK_SIZE`: Maximum characters per chunk (default: 500)

### Customizing Voices

Edit `src/types/index.ts` to add or modify voice models:

```typescript
export const VOICE_MODELS: VoiceModel[] = [
  {
    id: "model-id-from-huggingface",
    name: "Display Name",
    description: "Voice description"
  }
];
```

## Troubleshooting

### FFmpeg not found
- Ensure FFmpeg is installed and in your system PATH
- Test: `ffmpeg -version`

### API Rate Limiting
- Hugging Face free tier has rate limits
- Add delays between requests (already implemented: 1s delay)
- Consider upgrading to Hugging Face Pro

### Out of Memory
- Reduce `MAX_CHUNK_SIZE` for longer texts
- Process smaller text files

### Audio Quality Issues
- Try different voice models
- Adjust FFmpeg audio settings in `audioStitcher.ts`

## License

MIT License

## Credits

- Built with [Hugging Face](https://huggingface.co/) TTS models
- Audio processing via [FFmpeg](https://ffmpeg.org/)
