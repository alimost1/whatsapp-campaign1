import { useAuthStore } from '../store/auth'

export function useAuth() {
  const { user, token, isAuthenticated, logout } = useAuthStore()
  
  return {
    user,
    token,
    isAuthenticated,
    logout
  }
}
