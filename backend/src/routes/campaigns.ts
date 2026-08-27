import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all campaigns for current user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: req.user!.id },
      include: {
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ campaigns });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get campaign by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        messages: {
          include: {
            contact: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!campaign || campaign.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ campaign });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create campaign
router.post('/', authenticate, [
  body('name').trim().notEmpty(),
  body('description').optional().trim(),
  body('status').optional().isIn(['draft', 'active', 'paused', 'completed'])
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, status } = req.body;

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        status: status || 'draft',
        userId: req.user!.id
      }
    });

    res.status(201).json({ campaign });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update campaign
router.put('/:id', authenticate, [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('status').optional().isIn(['draft', 'active', 'paused', 'completed'])
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id }
    });

    if (!campaign || campaign.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const { name, description, status } = req.body;

    const updatedCampaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        status
      }
    });

    res.json({ campaign: updatedCampaign });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete campaign
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id }
    });

    if (!campaign || campaign.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    await prisma.campaign.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
