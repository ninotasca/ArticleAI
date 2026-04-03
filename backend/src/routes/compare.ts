import { Router } from 'express';
import type {
  ComparisonRequest,
  ComparisonResponse,
  ComparisonResultRow,
} from '../types.js';
import { getArticlesByIds } from '../services/supabase.js';
import { runPromptsForArticle } from '../services/ai.js';

const router = Router();

/** POST /api/compare — run prompts against articles and return comparison */
router.post('/', async (req, res) => {
  try {
    const { prompts, articleIds } = req.body as ComparisonRequest;

    if (!prompts?.length) {
      res.status(400).json({ error: 'At least one prompt is required' });
      return;
    }
    if (!articleIds?.length) {
      res.status(400).json({ error: 'At least one article must be selected' });
      return;
    }

    const startTime = Date.now();

    // Fetch the full articles
    const articles = await getArticlesByIds(articleIds);

    // Run all prompts against all articles
    // Articles processed in parallel; prompts within each article run sequentially
    const results: ComparisonResultRow[] = await Promise.all(
      articles.map(async (article) => ({
        article,
        results: await runPromptsForArticle(prompts, article),
      }))
    );

    const duration = Date.now() - startTime;

    const response: ComparisonResponse = {
      results,
      meta: {
        totalArticles: articles.length,
        totalPrompts: prompts.length,
        duration,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

export default router;
