import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

const router = Router();

// Upload file
router.post('/', authenticate, (req: AuthRequest, res: Response) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.status(201).json({
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }
    });
  });
});

// Get uploaded files
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const files = fs.readdirSync(uploadDir)
      .filter(file => !file.startsWith('.'))
      .map(file => {
        const stats = fs.statSync(path.join(uploadDir, file));
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
          url: `/uploads/${file}`
        };
      });

    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete file
router.delete('/:filename', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, req.params.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(filePath);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
