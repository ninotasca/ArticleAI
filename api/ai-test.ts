import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getArticlesByIds, getRandomArticles } from './_lib/supabase.js';
import { runPrompt } from './_lib/ai.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, articleId } = req.body as { prompt: string; articleId?: number };

    if (!prompt?.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let article;
    if (articleId) {
      const articles = await getArticlesByIds([articleId]);
      article = articles[0];
    }
    if (!article) {
      const articles = await getRandomArticles(1);
      article = articles[0];
    }
    if (!article) {
      return res.status(404).json({ error: 'No articles found in database' });
    }

    const result = await runPrompt(prompt, article);
    res.json({ article, result });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
