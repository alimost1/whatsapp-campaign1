import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all contacts for current user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const contacts = await prisma.contact.findMany({
      where: { userId: req.user!.id },
      include: {
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ contacts });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get contact by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!contact || contact.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ contact });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create contact
router.post('/', authenticate, [
  body('phone').trim().notEmpty(),
  body('name').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('tags').optional().isArray(),
  body('notes').optional().trim()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, name, email, tags, notes } = req.body;

    const existingContact = await prisma.contact.findFirst({
      where: {
        phone,
        userId: req.user!.id
      }
    });

    if (existingContact) {
      return res.status(400).json({ error: 'Contact already exists' });
    }

    const contact = await prisma.contact.create({
      data: {
        phone,
        name,
        email,
        tags: tags ? tags.join(',') : null,
        notes,
        userId: req.user!.id
      }
    });

    res.status(201).json({ contact });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update contact
router.put('/:id', authenticate, [
  body('phone').optional().trim().notEmpty(),
  body('name').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('tags').optional().isArray(),
  body('notes').optional().trim()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id }
    });

    if (!contact || contact.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const { phone, name, email, tags, notes } = req.body;

    const updatedContact = await prisma.contact.update({
      where: { id: req.params.id },
      data: {
        phone,
        name,
        email,
        tags: tags ? tags.join(',') : null,
        notes
      }
    });

    res.json({ contact: updatedContact });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete contact
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id }
    });

    if (!contact || contact.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await prisma.contact.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk delete contacts
router.delete('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Invalid contact IDs' });
    }

    await prisma.contact.deleteMany({
      where: {
        id: { in: ids },
        userId: req.user!.id
      }
    });

    res.json({ message: 'Contacts deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
