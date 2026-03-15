// src/context/AuthContext.jsx
// Provides global authentication state to the entire app.
// Wraps supabase.auth.getSession() and onAuthStateChange().

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]             = useState(null)
  const [profile, setProfile]             = useState(null)
  const [loading, setLoading]             = useState(true)   // initial bootstrap
  const [profileLoaded, setProfileLoaded] = useState(false)  // profile fetch resolved

  // ── Fetch profile row; resolves to null if not found (no hang) ──
  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      setProfile(!error && data ? data : null)
    } catch {
      setProfile(null)
    } finally {
      setProfileLoaded(true)
    }
  }

  // ── Bootstrap: restore session on mount ───────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfileLoaded(true)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setProfileLoaded(true)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const value = {
    session,
    profile,
    loading,
    profileLoaded,
    signOut,
    refreshProfile: () => session?.user && fetchProfile(session.user.id),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
