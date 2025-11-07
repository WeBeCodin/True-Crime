import app from './app';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🎙️  True Crime Narrator API is running on http://localhost:${PORT}`);
  console.log(`📝 Open http://localhost:${PORT} in your browser to use the app`);
});
