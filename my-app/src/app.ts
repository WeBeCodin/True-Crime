import express from 'express';
import cors from 'cors';
import * as path from 'path';
import routes from './routes';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve generated audio files
app.use('/audio', express.static(path.join(process.cwd(), 'output')));

// API Routes
app.use('/api', routes);

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

export default app;