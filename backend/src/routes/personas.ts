import { Router } from 'express';
import {
  getAllPersonas,
  createPersona,
  updatePersona,
  deletePersona,
} from '../services/personas.js';

const router = Router();

/** GET /api/personas — list all personas */
router.get('/', async (_req, res) => {
  try {
    const personas = await getAllPersonas();
    res.json({ personas });
  } catch (error) {
    console.error('Get personas error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/** POST /api/personas — create a new persona */
router.post('/', async (req, res) => {
  try {
    const { title, persona } = req.body;
    if (!title?.trim() || !persona?.trim()) {
      res.status(400).json({ error: 'title and persona are required' });
      return;
    }
    const created = await createPersona({ title, persona });
    res.status(201).json({ persona: created });
  } catch (error) {
    console.error('Create persona error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/** PUT /api/personas/:id — update a persona */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, persona } = req.body;
    const updated = await updatePersona(id, { title, persona });
    res.json({ persona: updated });
  } catch (error) {
    console.error('Update persona error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/** DELETE /api/personas/:id — delete a persona */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deletePersona(id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete persona error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
