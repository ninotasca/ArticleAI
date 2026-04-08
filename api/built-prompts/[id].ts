import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateBuiltPrompt, deleteBuiltPrompt } from '../_lib/builtPrompts.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;

  try {
    if (req.method === 'PUT') {
      const bp = await updateBuiltPrompt(id, req.body);
      return res.json({ builtPrompt: bp });
    }

    if (req.method === 'DELETE') {
      await deleteBuiltPrompt(id);
      return res.status(204).send('');
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
