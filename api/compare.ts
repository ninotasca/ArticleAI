import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getArticlesByIds } from './_lib/supabase';
import { runPromptsForArticle } from './_lib/ai';
import type { Prompt } from './_lib/prompts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompts, articleIds } = req.body as { prompts: Prompt[]; articleIds: number[] };

    if (!prompts?.length) {
      return res.status(400).json({ error: 'At least one prompt is required' });
    }
    if (!articleIds?.length) {
      return res.status(400).json({ error: 'At least one article must be selected' });
    }

    const startTime = Date.now();
    const articles = await getArticlesByIds(articleIds);

    const results = await Promise.all(
      articles.map(async (article) => ({
        article,
        results: await runPromptsForArticle(prompts, article),
      }))
    );

    res.json({
      results,
      meta: {
        totalArticles: articles.length,
        totalPrompts: prompts.length,
        duration: Date.now() - startTime,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
