import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { getArticlesByIds } = await import('../_lib/supabase.js');
    const id = parseInt(req.query.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid article ID' });
    }
    const articles = await getArticlesByIds([id]);
    if (!articles.length) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json({ article: articles[0] });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
