import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getArticles, getArticleCount } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const [articles, total] = await Promise.all([getArticles(limit, offset), getArticleCount()]);
    res.json({ articles, total });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
