import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllBuiltPrompts, createBuiltPrompt } from '../_lib/builtPrompts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const builtPrompts = await getAllBuiltPrompts();
      return res.json({ builtPrompts });
    }

    if (req.method === 'POST') {
      const {
        name,
        brandVoiceInstructions,
        brandVoiceId,
        titlePromptId,
        bodyPromptId,
        additionalInstructions,
        outputRules,
        assembledPrompt,
      } = req.body;

      if (!name?.trim() || !assembledPrompt?.trim()) {
        return res.status(400).json({ error: 'name and assembledPrompt are required' });
      }

      const bp = await createBuiltPrompt({
        name,
        brandVoiceInstructions: brandVoiceInstructions || '',
        brandVoiceId: brandVoiceId || null,
        titlePromptId: titlePromptId || null,
        bodyPromptId: bodyPromptId || null,
        additionalInstructions: additionalInstructions || '',
        outputRules: outputRules || '',
        assembledPrompt,
      });
      return res.status(201).json({ builtPrompt: bp });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
