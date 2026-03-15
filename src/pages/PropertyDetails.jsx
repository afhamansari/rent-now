// src/pages/PropertyDetails.jsx
// Full property information page with message box for tenants.

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import MessageBox from '../components/MessageBox'

export default function PropertyDetails() {
  const { id } = useParams()
  const { session, profile } = useAuth()
  const navigate = useNavigate()

  const [property, setProperty] = useState(null)
  const [extraPhotos, setExtraPhotos] = useState([])  // additional gallery photos
  const [loading, setLoading]   = useState(true)
  const [showMsg, setShowMsg]   = useState(false)
  const [lightbox, setLightbox] = useState(null)       // URL of photo to show full-screen

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        navigate('/')
      } else {
        setProperty(data)
        // Load additional photos
        const { data: photos } = await supabase
          .from('property_photos')
          .select('url')
          .eq('property_id', id)
          .order('created_at', { ascending: true })
        setExtraPhotos((photos || []).map(p => p.url))
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="loading-page"><div className="spinner" /></div>
  if (!property) return null

  const isOwner = session?.user?.id === property.owner_id

  return (
    <div className="page">
      <div className="container section">
        {/* Back link */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem', fontWeight: 500 }}>
          ← Back to listings
        </Link>

        {/* Hero image */}
        <div className="property-details-hero" style={property.image_url ? { background: 'none', padding: 0 } : {}}>
          {property.image_url ? (
            <img src={property.image_url} alt={property.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius)', display: 'block', cursor: 'zoom-in' }}
              onClick={() => setLightbox(property.image_url)}
            />
          ) : '🏡'}
        </div>

        {/* Additional photos gallery */}
        {extraPhotos.length > 0 && (
          <div className="photo-gallery">
            {extraPhotos.map((url, i) => (
              <div key={i} className="photo-gallery-thumb" onClick={() => setLightbox(url)}>
                <img src={url} alt={`Photo ${i + 1}`} />
                <div className="photo-gallery-overlay">🔍</div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightbox && (
          <div className="lightbox" onClick={() => setLightbox(null)}>
            <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            <img src={lightbox} alt="Full size" onClick={e => e.stopPropagation()} />
          </div>
        )}

        {/* Two-column layout */}
        <div className="property-details-layout">
          {/* Main content */}
          <div className="property-details-main">
            <div className="property-details-city">{property.city}</div>
            <h1 className="property-details-title">{property.title}</h1>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
              📍 {property.address}
            </div>

            {/* Specs bar */}
            <div className="property-details-specs">
              <div className="spec-item">
                <div className="spec-value">{property.bedrooms}</div>
                <div className="spec-label">Bedrooms</div>
              </div>
              <div className="spec-item">
                <div className="spec-value">{property.bathrooms}</div>
                <div className="spec-label">Bathrooms</div>
              </div>
              <div className="spec-item">
                <div className="spec-value">₹{property.price.toLocaleString()}</div>
                <div className="spec-label">per month</div>
              </div>
              {property.max_occupants && (
                <div className="spec-item">
                  <div className="spec-value">{property.max_occupants}</div>
                  <div className="spec-label">Max people</div>
                </div>
              )}
            </div>

            <hr className="divider" />

            {/* Description */}
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              About this property
            </h2>
            <p className="property-description">{property.description}</p>

            <hr className="divider" />

            {/* Tenant requirements section */}
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Tenant Requirements
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              {[
                ['Preferred Tenants', {
                  girls:  '👩 Girls only',
                  boys:   '👨 Boys only',
                  family: '👨‍👩‍👧 Family',
                  any:    '👥 All welcome',
                }[property.preferred_tenants] || '👥 All welcome'],
                ['Max Occupants', property.max_occupants ? `${property.max_occupants} people` : 'No limit'],
              ].map(([label, value]) => (
                <div key={label} style={{ background: 'var(--accent-light)', border: '1px solid rgba(200,98,42,0.15)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)' }}>{label}</div>
                  <div style={{ fontWeight: 600, marginTop: '3px' }}>{value}</div>
                </div>
              ))}
            </div>
            {property.other_requirements && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Other Requirements
                </div>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.6, margin: 0, color: 'var(--text)' }}>
                  {property.other_requirements}
                </p>
              </div>
            )}

            <hr className="divider" />

            {/* Details table */}
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Property Details
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                ['City', property.city],
                ['Address', property.address],
                ['Bedrooms', property.bedrooms],
                ['Bathrooms', property.bathrooms],
                ['Monthly Rent', `₹${property.price.toLocaleString()}`],
                ['Listed', new Date(property.created_at).toLocaleDateString()],
              ].map(([label, value]) => (
                <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{label}</div>
                  <div style={{ fontWeight: 500, marginTop: '3px' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="property-details-sidebar">
            <div className="price-display">
              <div className="price-display-num">₹{property.price.toLocaleString()}</div>
              <div className="price-display-per">per month</div>
            </div>

            {/* Contact / Message area */}
            {isOwner ? (
              <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', color: 'var(--accent)', fontWeight: 500 }}>
                🏠 This is your property
              </div>
            ) : !session ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                  Log in to contact the landlord
                </p>
                <Link to="/login" className="btn btn-primary btn-full">
                  Log in to contact
                </Link>
              </div>
            ) : (
              <>
                {!showMsg ? (
                  <button className="btn btn-primary btn-full btn-lg" onClick={() => setShowMsg(true)}>
                    💬 Contact Landlord
                  </button>
                ) : (
                  <MessageBox propertyId={property.id} landlordId={property.owner_id} />
                )}
              </>
            )}

            <hr className="divider" />

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              🔒 Your message goes directly to the landlord. No middlemen.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
