import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all templates
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get template by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create template (admin only)
router.post('/', authenticate, authorize('admin'), [
  body('name').trim().notEmpty(),
  body('content').trim().notEmpty(),
  body('variables').optional().isArray(),
  body('description').optional().trim()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, content, variables, description } = req.body;

    const existingTemplate = await prisma.template.findUnique({
      where: { name }
    });

    if (existingTemplate) {
      return res.status(400).json({ error: 'Template already exists' });
    }

    const template = await prisma.template.create({
      data: {
        name,
        content,
        variables: variables ? variables.join(',') : null,
        description
      }
    });

    res.status(201).json({ template });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update template (admin only)
router.put('/:id', authenticate, authorize('admin'), [
  body('name').optional().trim().notEmpty(),
  body('content').optional().trim().notEmpty(),
  body('variables').optional().isArray(),
  body('description').optional().trim()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const template = await prisma.template.findUnique({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const { name, content, variables, description } = req.body;

    const updatedTemplate = await prisma.template.update({
      where: { id: req.params.id },
      data: {
        name,
        content,
        variables: variables ? variables.join(',') : null,
        description
      }
    });

    res.json({ template: updatedTemplate });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete template (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await prisma.template.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
