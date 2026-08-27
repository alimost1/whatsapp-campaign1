import { body } from 'express-validator'

export const contactValidators = [
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('name').optional().trim(),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('tags').optional().isArray(),
  body('notes').optional().trim()
]

export const campaignValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').optional().trim(),
  body('status').optional().isIn(['draft', 'active', 'paused', 'completed'])
]

export const messageValidators = [
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('contactId').trim().notEmpty().withMessage('Contact ID is required'),
  body('campaignId').optional().trim(),
  body('scheduledAt').optional().isISO8601()
]
