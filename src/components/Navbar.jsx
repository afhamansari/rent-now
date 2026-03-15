// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { session, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="navbar-logo-mark">
          <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
        </div>
        Rent<span>Now</span>
      </Link>

      <ul className="navbar-links">
        <li><Link to="/">Browse</Link></li>

        {!session ? (
          <>
            <li><Link to="/login">Log in</Link></li>
            <li><Link to="/signup" className="btn-primary">Sign up</Link></li>
          </>
        ) : (
          <>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li>
              <div className="navbar-user-badge">
                {profile?.role === 'landlord' ? '🏠' : '🔍'} {profile?.role}
              </div>
            </li>
            <li>
              <button onClick={handleSignOut} className="btn btn-ghost btn-sm">
                Sign out
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  )
}
