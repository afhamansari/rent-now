// src/pages/CreateProperty.jsx
// Landlords use this page to list a new property.
// Redirects non-landlords and unauthenticated users.

import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PropertyForm from '../components/PropertyForm'

export default function CreateProperty() {
  const { session, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!session) navigate('/login')
      else if (profile && profile.role !== 'landlord') navigate('/dashboard')
    }
  }, [session, profile, authLoading])

  if (authLoading) {
    return <div className="loading-page"><div className="spinner" /></div>
  }

  async function handleSubmit(formData) {
    setSaving(true)
    const { extraPhotoUrls = [], ...propertyData } = formData

    const { data, error } = await supabase.from('properties').insert({
      ...propertyData,
      owner_id: session.user.id,
    }).select().single()

    if (error) {
      alert('Error creating property: ' + error.message)
      setSaving(false)
      return
    }

    // Insert additional photos if any
    if (extraPhotoUrls.length > 0) {
      await supabase.from('property_photos').insert(
        extraPhotoUrls.map(url => ({ property_id: data.id, url }))
      )
    }

    setSuccess(true)
    setTimeout(() => navigate(`/property/${data.id}`), 1500)
    setSaving(false)
  }

  return (
    <div className="page">
      <div className="container section">
        <div className="page-header">
          <Link to="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 500 }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ marginTop: '0.75rem' }}>List a Property</h1>
          <p>Fill in the details below to list your property for tenants to discover.</p>
        </div>

        <div className="form-card">
          {success && (
            <div className="form-success">
              ✅ Property listed successfully! Redirecting...
            </div>
          )}
          <PropertyForm onSubmit={handleSubmit} loading={saving} />
        </div>
      </div>
    </div>
  )
}
