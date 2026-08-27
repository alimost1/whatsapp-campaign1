import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();

// Get all messages for current user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        contact: {
          userId: req.user!.id
        }
      },
      include: {
        contact: true,
        campaign: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get message by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id },
      include: {
        contact: true,
        campaign: true
      }
    });

    if (!message || message.contact.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create message
router.post('/', authenticate, [
  body('content').trim().notEmpty(),
  body('contactId').trim().notEmpty(),
  body('campaignId').optional().trim(),
  body('scheduledAt').optional().isISO8601()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, contactId, campaignId, scheduledAt } = req.body;

    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    });

    if (!contact || contact.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const message = await prisma.message.create({
      data: {
        content,
        contactId,
        campaignId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? 'scheduled' : 'pending'
      },
      include: {
        contact: true,
        campaign: true
      }
    });

    // Send immediately if not scheduled
    if (!scheduledAt) {
      try {
        const evolutionUrl = process.env.EVOLUTION_API_URL;
        const instanceName = process.env.EVOLUTION_INSTANCE_NAME;
        
        if (evolutionUrl && instanceName) {
          await axios.post(
            `${evolutionUrl}/message/sendText/${instanceName}`,
            {
              number: contact.phone.replace(/\D/g, ''),
              textMessage: { text: content }
            },
            {
              headers: {
                'apikey': process.env.EVOLUTION_API_KEY
              }
            }
          );
          
          await prisma.message.update({
            where: { id: message.id },
            data: {
              status: 'sent',
              sentAt: new Date()
            }
          });
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        await prisma.message.update({
          where: { id: message.id },
          data: { status: 'failed' }
        });
      }
    }

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update message
router.put('/:id', authenticate, [
  body('content').optional().trim().notEmpty(),
  body('status').optional().isIn(['pending', 'sent', 'failed', 'scheduled'])
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const message = await prisma.message.findUnique({
      where: { id: req.params.id },
      include: { contact: true }
    });

    if (!message || message.contact.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const { content, status } = req.body;

    const updatedMessage = await prisma.message.update({
      where: { id: req.params.id },
      data: {
        content,
        status
      },
      include: {
        contact: true,
        campaign: true
      }
    });

    res.json({ message: updatedMessage });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete message
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.id },
      include: { contact: true }
    });

    if (!message || message.contact.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await prisma.message.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
