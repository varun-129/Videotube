import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import ProtectedRoute from './components/ui/ProtectedRoute'

// Pages
import Home       from './pages/Home'
import Login      from './pages/Login'
import Register   from './pages/Register'
import Watch      from './pages/Watch'
import Channel    from './pages/Channel'
import Search     from './pages/Search'
import Explore    from './pages/Explore'
import Dashboard  from './pages/Dashboard'
import Settings   from './pages/Settings'
import { LikedVideos, WatchHistory, Playlists, Tweets } from './pages/misc'
import './pages/misc.css'

const AUTH_ROUTES = ['/login', '/register']

export default function App() {
  const { fetchCurrentUser } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const isAuthPage = AUTH_ROUTES.includes(location.pathname)

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    )
  }

  return (
    <div className="app-shell">
      <Header />
      <Sidebar />
      <main style={{
        gridColumn: 2,
        gridRow: 2,
        overflowY: 'auto',
        minHeight: 0,
        background: 'var(--bg-0)',
        width: '100%',
        minWidth: 0,
      }}>
        <Routes>
          {/* Public */}
          <Route path="/"                   element={<Home />} />
          <Route path="/explore"            element={<Explore />} />
          <Route path="/watch/:id"          element={<Watch />} />
          <Route path="/channel/:username"  element={<Channel />} />
          <Route path="/search"             element={<Search />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/settings"   element={<Settings />} />
            <Route path="/liked"      element={<LikedVideos />} />
            <Route path="/history"    element={<WatchHistory />} />
            <Route path="/playlists"  element={<Playlists />} />
            <Route path="/tweets"     element={<Tweets />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="empty-state" style={{ minHeight: '80vh' }}>
              <div style={{ fontSize: 80, opacity: 0.15, fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>404</div>
              <h3>Page Not Found</h3>
              <p>The page you're looking for doesn't exist.</p>
              <a href="/" className="btn btn-primary" style={{ marginTop: 8 }}>← Go Home</a>
            </div>
          } />
        </Routes>
      </main>
    </div>
  )
}
