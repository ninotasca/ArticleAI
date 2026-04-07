import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRandomArticles } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const count = parseInt(req.query.count as string) || 10;
    const articles = await getRandomArticles(count);
    res.json({ articles });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
