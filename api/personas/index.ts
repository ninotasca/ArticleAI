import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllPersonas, createPersona } from '../_lib/personas.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const personas = await getAllPersonas();
      return res.json({ personas });
    }

    if (req.method === 'POST') {
      const { title, persona } = req.body;
      if (!title?.trim() || !persona?.trim()) {
        return res.status(400).json({ error: 'title and persona are required' });
      }
      const created = await createPersona({ title, persona });
      return res.status(201).json({ persona: created });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
