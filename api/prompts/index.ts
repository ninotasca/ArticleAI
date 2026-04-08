import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllPrompts, createPrompt } from '../_lib/prompts.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const prompts = await getAllPrompts();
      return res.json({ prompts });
    }

    if (req.method === 'POST') {
      const { name, template, targetField } = req.body;
      if (!name?.trim() || !template?.trim() || !targetField) {
        return res.status(400).json({ error: 'name, template, and targetField are required' });
      }
      const prompt = await createPrompt({ name, template, targetField });
      return res.status(201).json({ prompt });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
