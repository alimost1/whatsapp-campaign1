import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { FileText } from 'lucide-react'

export default function Templates() {
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await api.get('/templates')
      return response.data.templates || []
    }
  })

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Templates</h1>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {templatesData?.map((template: any) => (
          <div key={template.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-start mb-4">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{template.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{template.description || 'No description'}</p>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-md p-4">
              <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{template.content}</pre>
            </div>
            {template.variables && (
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {template.variables.split(',').map((variable: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs rounded-full">
                      {variable.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {(!templatesData || templatesData.length === 0) && (
          <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">
            No templates available. Contact your administrator to create templates.
          </div>
        )}
      </div>
    </div>
  )
}