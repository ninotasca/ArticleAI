import { Router } from 'express';
import {
  getAllBuiltPrompts,
  createBuiltPrompt,
  updateBuiltPrompt,
  deleteBuiltPrompt,
} from '../services/builtPrompts.js';

const router = Router();

/** GET /api/built-prompts — list all built prompts */
router.get('/', async (_req, res) => {
  try {
    const builtPrompts = await getAllBuiltPrompts();
    res.json({ builtPrompts });
  } catch (error) {
    console.error('Get built prompts error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/** POST /api/built-prompts — create a new built prompt */
router.post('/', async (req, res) => {
  try {
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
      res
        .status(400)
        .json({ error: 'name and assembledPrompt are required' });
      return;
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
    res.status(201).json({ builtPrompt: bp });
  } catch (error) {
    console.error('Create built prompt error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/** PUT /api/built-prompts/:id — update a built prompt */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bp = await updateBuiltPrompt(id, req.body);
    res.json({ builtPrompt: bp });
  } catch (error) {
    console.error('Update built prompt error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/** DELETE /api/built-prompts/:id — delete a built prompt */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteBuiltPrompt(id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete built prompt error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
