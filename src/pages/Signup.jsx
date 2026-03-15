// src/pages/Signup.jsx
// Creates a Supabase Auth user and upserts a profiles row with the chosen role.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState('tenant')
  const [error, setError]       = useState('')
  const [info, setInfo]         = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    // 1. Create the auth user
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const userId = data?.user?.id

    if (!userId) {
      // Email confirmation required — tell the user
      setInfo('Check your email and click the confirmation link, then log in.')
      setLoading(false)
      return
    }

    // 2. Upsert the profile row (upsert handles any duplicate race condition)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: userId, role }, { onConflict: 'id' })

    if (profileError) {
      // Profile save failed — still let them log in, profile will retry on login
      console.warn('Profile upsert failed:', profileError.message)
    }

    navigate('/')
    setLoading(false)
  }

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-side">
        <div className="auth-side-content">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 600, color: '#fff' }}>Rent Now</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>Rental Marketplace</div>
        </div>
        <div>
          <h2>List & find<br /><em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.65)' }}>homes with ease</em></h2>
          <p>Whether you're a landlord or a tenant, Rent Now makes the process simple and direct.</p>
        </div>
        <div className="auth-side-quote">
          "Listed my property on a Sunday, had 5 messages by Monday morning."<br />
          <strong style={{ color: 'rgba(255,255,255,0.65)' }}>— Rahul M., Landlord in Mumbai</strong>
        </div>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Create account
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Already have one? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>Log in</Link>
          </p>

          {error && <div className="form-error">{error}</div>}
          {info  && <div className="form-success">{info}</div>}

          <form onSubmit={handleSubmit}>
            {/* Role selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                I am a...
              </div>
              <div className="role-selector">
                <label className={`role-option ${role === 'tenant' ? 'selected' : ''}`}>
                  <input type="radio" name="role" value="tenant" checked={role === 'tenant'} onChange={() => setRole('tenant')} />
                  <div className="role-icon">🔍</div>
                  <div className="role-label">Tenant</div>
                  <div className="role-desc">Looking to rent a home</div>
                </label>
                <label className={`role-option ${role === 'landlord' ? 'selected' : ''}`}>
                  <input type="radio" name="role" value="landlord" checked={role === 'landlord'} onChange={() => setRole('landlord')} />
                  <div className="role-icon">🏠</div>
                  <div className="role-label">Landlord</div>
                  <div className="role-desc">I have a property to list</div>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters" minLength={6} required />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
