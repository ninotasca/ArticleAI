import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updatePersona, deletePersona } from '../_lib/personas.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;

  try {
    if (req.method === 'PUT') {
      const { title, persona } = req.body;
      const updated = await updatePersona(id, { title, persona });
      return res.json({ persona: updated });
    }

    if (req.method === 'DELETE') {
      await deletePersona(id);
      return res.status(204).send('');
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
