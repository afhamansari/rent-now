// src/pages/Login.jsx
// Email/password login using Supabase Auth.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      {/* Left decorative panel */}
      <div className="auth-side">
        <div className="auth-side-content">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
            Rent Now
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>Rental Marketplace</div>
        </div>

        <div>
          <h2>The smarter way<br /><em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.65)' }}>to find a home</em></h2>
          <p>Connect directly with property owners. No brokers, no delays.</p>
        </div>

        <div className="auth-side-quote">
          "Found my apartment in 2 days. The direct messaging feature is a game-changer."<br />
          <strong style={{ color: 'rgba(255,255,255,0.65)' }}>— Priya S., Tenant in Bangalore</strong>
        </div>
      </div>

      {/* Form side */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 500 }}>Sign up</Link>
          </p>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
