import { Router } from 'express';
import { runPrompt } from '../services/ai.js';
import { getRandomArticles } from '../services/supabase.js';

const router = Router();

/** POST /api/ai-test — run a freeform prompt with an article as context */
router.post('/', async (req, res) => {
  try {
    const { prompt, articleId } = req.body as {
      prompt: string;
      articleId?: number;
    };

    if (!prompt?.trim()) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    // If no article provided, grab a random one
    let article;
    if (articleId) {
      const { getArticlesByIds } = await import('../services/supabase.js');
      const articles = await getArticlesByIds([articleId]);
      article = articles[0];
    }

    if (!article) {
      const articles = await getRandomArticles(1);
      article = articles[0];
    }

    if (!article) {
      res.status(404).json({ error: 'No articles found in database' });
      return;
    }

    // The prompt template is the user's free-form prompt — we just pass the
    // article fields through the standard interpolation
    const result = await runPrompt(prompt, article);

    res.json({ article, result });
  } catch (error) {
    console.error('AI test error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
