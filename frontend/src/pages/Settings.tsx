import { useAuthStore } from '../store/auth'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { User, Shield, Database } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Settings() {
  const { user } = useAuthStore()

  const { data: evolutionStatus } = useQuery({
    queryKey: ['evolution-status'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      try {
        const response = await axios.get(`${API_URL}/api/evolution/status`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        return response.data.status
      } catch {
        return null
      }
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      
      <div className="space-y-6">
        {/* User Profile */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <User className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-base text-gray-900">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-base text-gray-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="text-base text-gray-900 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Evolution API Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Evolution API</h2>
          </div>
          {evolutionStatus ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-base text-green-600 font-medium">Connected</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Instance</p>
                <p className="text-base text-gray-900">{evolutionStatus.instance || 'N/A'}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Not configured or unavailable</p>
          )}
        </div>

        {/* Database Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Database className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Database</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="text-base text-gray-900">SQLite</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="text-base text-gray-900">backend/dev.db</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
