import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getMongoStatus } from './config/db.js';
import promptRoutes from './routes/promptRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { ensureAdminAccount } from './controllers/authController.js';
import { ensureDefaultPrompts } from './controllers/promptController.js';

dotenv.config();

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 5000;

// Hardened CORS policy
const allowedOrigins = [
  'https://devops-project-demo.study',
  'https://www.devops-project-demo.study',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:80'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/posts', promptRoutes); // Backward compatibility alias

app.get('/api/status', (req, res) => {
  res.json({
    platform: 'PromptVerse AI Prompt Engineering Hub',
    status: 'healthy',
    database: getMongoStatus() ? 'MongoDB Connected' : 'In-Memory Cache (MongoDB Offline)',
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'PromptVerse REST API Operational' });
});

connectDB().then(async () => {
  await ensureAdminAccount();
  await ensureDefaultPrompts();
  app.listen(PORT, () => {
    console.log(`[PromptVerse] Server active on port ${PORT}`);
    console.log(`[PromptVerse] Prompts API: http://localhost:${PORT}/api/prompts`);
    console.log(`[PromptVerse] Auth API: http://localhost:${PORT}/api/auth`);
  });
});
