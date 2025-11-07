# True Crime Narrator App - Setup Guide

## Quick Start

Follow these steps to get your True Crime Narrator app up and running:

### 1. Environment Setup

Create a `.env` file in the `my-app` directory:

```bash
cd my-app
cp .env.example .env
```

Edit `.env` and add your Hugging Face API key:

```env
HUGGINGFACE_API_KEY=hf_your_actual_api_key_here
PORT=3000
MAX_CHUNK_SIZE=500
```

**Get your API key**: Visit [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

### 2. Install FFmpeg (if not already installed)

FFmpeg is required for audio stitching:

```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y ffmpeg

# macOS
brew install ffmpeg

# Verify installation
ffmpeg -version
```

### 3. Start the Application

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

### 4. Access the App

Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. **Enter Text**: Either paste your script in the text area or upload a `.txt` file
2. **Select Voice**: Choose from the available AI voices
3. **Generate**: Click "Generate Audio" and wait (processing time depends on text length)
4. **Preview & Download**: Listen to the audio and download the MP3 file

## Features

- ✅ Text input via textarea or file upload
- ✅ Multiple AI voice options
- ✅ Intelligent text chunking at natural pauses
- ✅ Sequential TTS API calls with rate limiting
- ✅ Automatic audio stitching into single MP3
- ✅ In-browser audio preview
- ✅ Easy download

## Technical Details

### Architecture

**Backend (Node.js + TypeScript)**
- `TextChunkerService`: Splits text intelligently
- `HuggingFaceTTSService`: Handles TTS API calls
- `AudioStitcherService`: Concatenates audio with FFmpeg
- `AudioController`: Orchestrates the entire process

**Frontend (Vanilla JS)**
- Single-page application
- Real-time character count
- Progress feedback during generation
- Audio player and download

### API Endpoints

- `GET /api/voices` - List available voices
- `POST /api/generate-audio` - Generate audio from text
- `GET /api/health` - Health check
- `GET /audio/:filename` - Serve generated audio files

### Processing Flow

1. User submits text + voice selection
2. Text is split into ~500 character chunks at sentence boundaries
3. Each chunk is sent to Hugging Face TTS API sequentially (1s delay between)
4. Audio chunks are saved as temporary WAV files
5. FFmpeg concatenates all chunks into single MP3
6. Temporary files are cleaned up
7. Final MP3 is served to user

## Troubleshooting

### "FFmpeg not found"
- Ensure FFmpeg is installed: `ffmpeg -version`
- Check PATH environment variable

### "API Rate Limit"
- Free tier has limits
- Increase delay between chunks in `huggingFaceTTS.ts`
- Consider Hugging Face Pro

### "Processing takes too long"
- Reduce `MAX_CHUNK_SIZE` for more parallel-friendly chunks
- Use smaller text files for testing
- Consider caching for repeated texts

### "Audio quality issues"
- Try different voice models
- Adjust FFmpeg settings in `audioStitcher.ts` (bitrate, frequency)

## Voice Models

Current voices (editable in `src/types/index.ts`):
- **Narrator 1 - Clear**: `facebook/mms-tts-eng`
- **Narrator 2 - Natural**: `facebook/fastspeech2-en-ljspeech`
- **Narrator 3 - Deep**: `espnet/kan-bayashi_ljspeech_vits`

Add more by editing `VOICE_MODELS` array!

## File Structure

```
my-app/
├── src/               # TypeScript source
├── public/            # Frontend files
├── dist/              # Built TypeScript
├── temp/              # Temporary audio chunks (auto-created)
├── output/            # Generated MP3 files (auto-created)
├── uploads/           # Uploaded text files (auto-created)
├── .env               # Your environment variables
├── package.json       # Dependencies
└── tsconfig.json      # TypeScript config
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a reverse proxy (nginx) for serving static files
3. Set up automatic cleanup for old output files
4. Monitor disk space for temp/output directories
5. Consider rate limiting at API level
6. Use a process manager (PM2)

## License

MIT

## Support

For issues, check:
- Hugging Face API status
- FFmpeg installation
- Node.js version (16+)
- Disk space for temp files
