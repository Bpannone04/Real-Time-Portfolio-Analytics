import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env file from project root before importing database
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { testConnection } from './config/database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection on startup
testConnection().catch(console.error);

// Example API route
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({ 
      status: 'ok', 
      message: 'Backend server is running',
      database: dbConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.json({ 
      status: 'ok', 
      message: 'Backend server is running',
      database: 'error',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
