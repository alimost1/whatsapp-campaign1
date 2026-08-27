import { Request, Response, NextFunction } from 'express'

const messageCounts = new Map<string, { count: number; resetTime: number }>()

const MAX_MESSAGES_PER_MINUTE = parseInt(process.env.MAX_MESSAGES_PER_MINUTE || '10')
const MAX_MESSAGES_PER_HOUR = parseInt(process.env.MAX_MESSAGES_PER_HOUR || '100')

export const antiSpamMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'POST') {
    return next()
  }

  const userId = (req as any).user?.id
  if (!userId) {
    return next()
  }

  const now = Date.now()
  const userCount = messageCounts.get(userId) || { count: 0, resetTime: now + 60000 }

  // Reset counter if minute has passed
  if (now > userCount.resetTime) {
    userCount.count = 0
    userCount.resetTime = now + 60000
  }

  // Check rate limits
  if (userCount.count >= MAX_MESSAGES_PER_MINUTE) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: `Maximum ${MAX_MESSAGES_PER_MINUTE} messages per minute`
    })
  }

  userCount.count++
  messageCounts.set(userId, userCount)

  next()
}
