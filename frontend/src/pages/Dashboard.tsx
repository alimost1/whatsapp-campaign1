import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Users, Mail, MessageSquare, TrendingUp } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const [contacts, campaigns, messages] = await Promise.all([
        axios.get(`${API_URL}/api/contacts`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/campaigns`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      
      return {
        contacts: contacts.data.contacts?.length || 0,
        campaigns: campaigns.data.campaigns?.length || 0,
        messages: messages.data.messages?.length || 0,
        sentMessages: messages.data.messages?.filter((m: any) => m.status === 'sent').length || 0
      }
    }
  })

  const statsCards = [
    {
      name: 'Total Contacts',
      value: stats?.contacts || 0,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'Active Campaigns',
      value: stats?.campaigns || 0,
      icon: Mail,
      color: 'bg-green-500'
    },
    {
      name: 'Total Messages',
      value: stats?.messages || 0,
      icon: MessageSquare,
      color: 'bg-purple-500'
    },
    {
      name: 'Sent Messages',
      value: stats?.sentMessages || 0,
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ]

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-md p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/contacts"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Add Contacts</p>
              <p className="text-sm text-gray-500">Import or create new contacts</p>
            </div>
          </a>
          <a
            href="/campaigns"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Mail className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Create Campaign</p>
              <p className="text-sm text-gray-500">Start a new WhatsApp campaign</p>
            </div>
          </a>
          <a
            href="/messages"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Send Messages</p>
              <p className="text-sm text-gray-500">Compose and send messages</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
