import { Router } from 'express';
import {
  getAllPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
} from '../services/prompts.js';

const router = Router();

/** GET /api/prompts — list all prompts */
router.get('/', async (_req, res) => {
  try {
    const prompts = await getAllPrompts();
    res.json({ prompts });
  } catch (error) {
    console.error('Get prompts error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/** POST /api/prompts — create a new prompt */
router.post('/', async (req, res) => {
  try {
    const { name, template, targetField } = req.body;
    if (!name?.trim() || !template?.trim() || !targetField) {
      res
        .status(400)
        .json({ error: 'name, template, and targetField are required' });
      return;
    }
    const prompt = await createPrompt({ name, template, targetField });
    res.status(201).json({ prompt });
  } catch (error) {
    console.error('Create prompt error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/** PUT /api/prompts/:id — update a prompt */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, template, targetField } = req.body;
    const prompt = await updatePrompt(id, { name, template, targetField });
    res.json({ prompt });
  } catch (error) {
    console.error('Update prompt error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/** DELETE /api/prompts/:id — delete a prompt */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deletePrompt(id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete prompt error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
