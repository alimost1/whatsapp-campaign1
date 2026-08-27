import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { FileText } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Templates() {
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.templates || []
    }
  })

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Templates</h1>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {templatesData?.map((template: any) => (
          <div key={template.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start mb-4">
              <FileText className="h-6 w-6 text-blue-600 mr-3 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{template.description || 'No description'}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-md p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{template.content}</pre>
            </div>
            {template.variables && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {template.variables.split(',').map((variable: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {variable.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {(!templatesData || templatesData.length === 0) && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No templates available. Contact your administrator to create templates.
          </div>
        )}
      </div>
    </div>
  )
}
