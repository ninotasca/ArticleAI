import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import articlesRouter from './routes/articles.js';
import compareRouter from './routes/compare.js';
import aiTestRouter from './routes/aiTest.js';
import promptsRouter from './routes/prompts.js';
import personasRouter from './routes/personas.js';
import builtPromptsRouter from './routes/builtPrompts.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/experiments/title-prompts/latest.json', (_req, res) => {
  res.sendFile(path.join(repoRoot, 'experiments', 'title-prompts', 'latest.json'));
});

// Routes
app.use('/api/articles', articlesRouter);
app.use('/api/compare', compareRouter);
app.use('/api/ai-test', aiTestRouter);
app.use('/api/prompts', promptsRouter);
app.use('/api/personas', personasRouter);
app.use('/api/built-prompts', builtPromptsRouter);

// Health check — reports which services are configured
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    env: {
      supabase: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_KEY,
      openai: !!process.env.OPENAI_API_KEY,
    },
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ArticleAI Backend running on http://localhost:${PORT}`);
  console.log(
    `   Supabase: ${process.env.SUPABASE_URL ? '✅ Configured' : '❌ Not configured'}`
  );
  console.log(
    `   OpenAI:   ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}`
  );
});
