import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updatePrompt, deletePrompt } from '../_lib/prompts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;

  try {
    if (req.method === 'PUT') {
      const { name, template, targetField } = req.body;
      const prompt = await updatePrompt(id, { name, template, targetField });
      return res.json({ prompt });
    }

    if (req.method === 'DELETE') {
      await deletePrompt(id);
      return res.status(204).send('');
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
