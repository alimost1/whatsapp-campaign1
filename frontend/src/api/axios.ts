import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config
    
    // Only retry on 429 (rate limit)
    if (error.response?.status !== 429) {
      // Handle 401 - redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
    
    // Track retry count
    config._retryCount = config._retryCount ?? 0
    const maxRetries = 3
    
    if (config._retryCount >= maxRetries) {
      return Promise.reject(error)
    }
    
    config._retryCount += 1
    
    // Respect Retry-After header if present
    const retryAfterHeader = error.response.headers['retry-after']
    let waitMs
    
    if (retryAfterHeader) {
      // Header can be seconds or HTTP date
      waitMs = parseFloat(retryAfterHeader) * 1000
    } else {
      // Exponential backoff: 1s, 2s, 4s
      waitMs = Math.pow(2, config._retryCount) * 1000
    }
    
    // Add jitter to prevent thundering herd
    waitMs = waitMs * (0.5 + Math.random())
    
    await new Promise(resolve => setTimeout(resolve, waitMs))
    return api(config)
  }
)

export default api