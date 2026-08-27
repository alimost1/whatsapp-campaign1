export interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt?: string
}

export interface Contact {
  id: string
  phone: string
  name?: string
  email?: string
  tags?: string
  notes?: string
  userId: string
  createdAt: string
  updatedAt: string
  _count?: {
    messages: number
  }
}

export interface Campaign {
  id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  userId: string
  createdAt: string
  updatedAt: string
  _count?: {
    messages: number
  }
}

export interface Message {
  id: string
  content: string
  status: 'pending' | 'sent' | 'failed' | 'scheduled'
  scheduledAt?: string
  sentAt?: string
  contactId: string
  campaignId?: string
  contact?: Contact
  campaign?: Campaign
  createdAt: string
  updatedAt: string
}

export interface Template {
  id: string
  name: string
  content: string
  variables?: string
  description?: string
  createdAt: string
  updatedAt: string
}
