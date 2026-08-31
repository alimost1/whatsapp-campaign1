import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Only retry on 429 (rate limit), max 3 times
        const axiosError = error as { response?: { status?: number } }
        return axiosError.response?.status === 429 && failureCount < 3
      },
      retryDelay: (failureCount, error) => {
        // Respect Retry-After header
        const axiosError = error as { response?: { headers?: { 'retry-after'?: string } } }
        const retryAfter = axiosError.response?.headers?.['retry-after']
        if (retryAfter) {
          return parseFloat(retryAfter) * 1000
        }
        // Exponential backoff: 1s, 2s, 4s
        return Math.min(1000 * Math.pow(2, failureCount), 4000)
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)