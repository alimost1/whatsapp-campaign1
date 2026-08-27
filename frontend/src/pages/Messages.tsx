import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Send } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Messages() {
  const queryClient = useQueryClient()
  const [newMessage, setNewMessage] = useState({
    content: '',
    contactId: ''
  })

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.messages || []
    }
  })

  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.contacts || []
    }
  })

  const sendMessageMutation = useMutation({
    mutationFn: async (message: any) => {
      const token = localStorage.getItem('token')
      const response = await axios.post(`${API_URL}/api/messages`, message, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      setNewMessage({ content: '', contactId: '' })
      toast.success('Message sent successfully')
    },
    onError: () => {
      toast.error('Failed to send message')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.contactId || !newMessage.content) {
      toast.error('Please select a contact and enter a message')
      return
    }
    sendMessageMutation.mutate(newMessage)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600'
      case 'failed': return 'text-red-600'
      case 'scheduled': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  if (messagesLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Send Message Form */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact *
              </label>
              <select
                value={newMessage.contactId}
                onChange={(e) => setNewMessage({ ...newMessage, contactId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a contact</option>
                {contactsData?.map((contact: any) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name || contact.phone}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message *
              </label>
              <textarea
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                placeholder="Type your message here..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={sendMessageMutation.isPending}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send className="h-5 w-5 mr-2" />
              {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>

      {/* Messages List */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {messagesData?.map((message: any) => (
              <div key={message.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{message.content}</p>
                    <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                      <span>{message.contact?.name || message.contact?.phone}</span>
                      <span>•</span>
                      <span>{new Date(message.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${getStatusColor(message.status)}`}>
                    {message.status}
                  </span>
                </div>
              </div>
            ))}
            {(!messagesData || messagesData.length === 0) && (
              <div className="p-6 text-center text-gray-500">
                No messages yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
