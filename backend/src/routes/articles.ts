import { Router } from 'express';
import {
  getArticles,
  getRandomArticles,
  getArticleCount,
} from '../services/supabase.js';

const router = Router();

/** GET /api/articles — list articles with pagination */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const articles = await getArticles(limit, offset);
    const total = await getArticleCount();
    res.json({ articles, total });
  } catch (error) {
    console.error('Articles error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/** GET /api/articles/sample?count=10 — get N random articles */
router.get('/sample', async (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 10;
    const articles = await getRandomArticles(count);
    res.json({ articles });
  } catch (error) {
    console.error('Sample error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
