import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Campaigns from './pages/Campaigns'
import Messages from './pages/Messages'
import Templates from './pages/Templates'
import Settings from './pages/Settings'
import Scraper from './pages/Scraper'
import Layout from './components/Layout'

function App() {
  const { isAuthenticated, isHydrated } = useAuthStore()

  // Don't render routes until auth store is hydrated from localStorage
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
      />
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Layout>
              <Dashboard />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="/contact" element={<Navigate to="/contacts" replace />} />
      <Route
        path="/contacts"
        element={
          isAuthenticated ? (
            <Layout>
              <Contacts />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/campaigns"
        element={
          isAuthenticated ? (
            <Layout>
              <Campaigns />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/messages"
        element={
          isAuthenticated ? (
            <Layout>
              <Messages />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/templates"
        element={
          isAuthenticated ? (
            <Layout>
              <Templates />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/scraper"
        element={
          isAuthenticated ? (
            <Layout>
              <Scraper />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/settings"
        element={
          isAuthenticated ? (
            <Layout>
              <Settings />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
    </Routes>
  )
}

export default App
