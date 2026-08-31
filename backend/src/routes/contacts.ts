import { Router, Response, Request } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Multer config for CSV uploads
const UPLOAD_DIR = path.join(process.cwd(), 'uploads/contacts');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.originalname.match(/\.(csv)$/i)) cb(null, true);
    else cb(new Error('CSV files only (.csv)'));
  },
});

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

// Upload contacts from CSV
router.post('/upload', authenticate, (req: AuthRequest, res: Response) => {
  upload.single('file')(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { groupName } = req.body;

    try {
      const fileContent = fs.readFileSync(req.file.path, 'utf-8');
      const lines = fileContent.trim().split('\n');
      
      if (lines.length < 2) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'CSV must have header and at least one row' });
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const nameIdx = headers.indexOf('name');
      const phoneIdx = headers.indexOf('phone');
      const groupIdx = headers.indexOf('group_name');

      if (nameIdx === -1 || phoneIdx === -1) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'CSV must have "name" and "phone" columns' });
      }

      let imported = 0;
      let skipped = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const name = values[nameIdx] || '';
        const phone = values[phoneIdx] || '';
        const group_name = groupIdx !== -1 ? values[groupIdx] : (groupName || null);

        if (!phone || phone.length < 10) {
          skipped++;
          continue;
        }

        // Check if contact already exists
        const existing = await prisma.contact.findFirst({
          where: { phone, userId: req.user!.id }
        });

        if (existing) {
          skipped++;
          continue;
        }

        await prisma.contact.create({
          data: {
            name,
            phone,
            group_name,
            userId: req.user!.id
          }
        });
        imported++;
      }

      fs.unlinkSync(req.file.path);
      res.json({ imported, skipped, total: lines.length - 1 });
    } catch (e: any) {
      try { fs.unlinkSync(req.file.path); } catch {}
      res.status(500).json({ error: e.message });
    }
  });
});

export default router;
