import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../ui/Button'

export default function Navbar() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="bg-surface-light border-b border-surface-lighter sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="text-lg font-bold text-primary-light no-underline">
          D11 League
        </Link>

        {user && (
          <div className="flex items-center gap-3">
            <Link to="/profile" className="text-sm text-text-muted hover:text-text no-underline">
              {profile?.displayName || 'Profile'}
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
