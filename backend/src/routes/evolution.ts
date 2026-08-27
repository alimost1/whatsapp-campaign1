import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import axios from 'axios';

const router = Router();

// Get Evolution API status
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME;
    
    if (!evolutionUrl || !instanceName) {
      return res.status(500).json({ error: 'Evolution API not configured' });
    }

    const response = await axios.get(`${evolutionUrl}/instance/connectionState/${instanceName}`, {
      headers: {
        'apikey': process.env.EVOLUTION_API_KEY
      }
    });

    res.json({ status: response.data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get Evolution API status' });
  }
});

// Send WhatsApp message
router.post('/send', authenticate, [
  // Validation handled in messages route
], async (req: AuthRequest, res: Response) => {
  try {
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME;
    
    if (!evolutionUrl || !instanceName) {
      return res.status(500).json({ error: 'Evolution API not configured' });
    }

    const { number, message } = req.body;

    const response = await axios.post(
      `${evolutionUrl}/message/sendText/${instanceName}`,
      {
        number: number.replace(/\D/g, ''),
        textMessage: { text: message }
      },
      {
        headers: {
          'apikey': process.env.EVOLUTION_API_KEY
        }
      }
    );

    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
