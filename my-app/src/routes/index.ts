import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only .txt files are allowed'));
    }
  },
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * POST /api/generate-audio
 * Generate audio from text input
 */
router.post('/generate-audio', upload.single('textFile'), async (req: Request, res: Response) => {
  try {
    let inputText: string = '';

    // Get text from either textarea or uploaded file
    if (req.file) {
      // Read text from uploaded file
      inputText = fs.readFileSync(req.file.path, 'utf-8');
      
      // Clean up uploaded file after reading
      fs.unlinkSync(req.file.path);
    } else if (req.body.text) {
      // Get text from request body
      inputText = req.body.text;
    } else {
      return res.status(400).json({
        success: false,
        error: 'No text provided. Please provide text or upload a file.',
      });
    }

    const voiceModelId = req.body.voiceModelId;

    if (!voiceModelId) {
      return res.status(400).json({
        success: false,
        error: 'Voice model ID is required',
      });
    }

    if (!inputText || inputText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text cannot be empty',
      });
    }

    // Import controller dynamically to avoid circular dependencies
    const { AudioController } = await import('../controllers');
    const controller = new AudioController();

    // Generate audio (this will take a while for long texts)
    const result = await controller.generateAudio(inputText, voiceModelId);

    res.json({
      success: true,
      audioUrl: `/audio/${path.basename(result.audioPath)}`,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error in /generate-audio:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate audio',
    });
  }
});

/**
 * GET /api/voices
 * Get available voice models
 */
router.get('/voices', (req: Request, res: Response) => {
  const { VOICE_MODELS } = require('../types');
  res.json({
    success: true,
    voices: VOICE_MODELS,
  });
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'True Crime Narrator API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;