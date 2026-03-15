// src/pages/Dashboard.jsx
// Role-aware dashboard with accurate stats.
//
// Landlord:
//   Stats: properties listed, unique tenants who messaged,
//          total messages received, total listing value
//   Tabs:  My Listings | Tenant Messages (full threads per property)
//
// Tenant:
//   Stats: properties contacted, messages sent, replies received
//   View:  full two-way thread per property (sent + received)

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PropertyCard from '../components/PropertyCard'

// ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { session, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !session) navigate('/login')
  }, [session, authLoading])

  if (authLoading) return <div className="loading-page"><div className="spinner" /></div>

  const role = profile?.role || 'tenant'
  return role === 'landlord'
    ? <LandlordDashboard session={session} />
    : <TenantDashboard session={session} />
}

// ─────────────────────────────────────────────────────────────────
// LANDLORD DASHBOARD
// ─────────────────────────────────────────────────────────────────
function LandlordDashboard({ session }) {
  const [properties, setProperties] = useState([])
  const [messages, setMessages]     = useState([])   // all messages on landlord's properties
  const [dataLoading, setDataLoading] = useState(true)
  const [activeTab, setActiveTab]   = useState('listings')

  useEffect(() => {
    async function load() {
      // 1. Fetch all properties owned by this landlord
      const { data: props } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false })

      const propList = props || []
      setProperties(propList)

      // 2. Fetch all messages for those properties
      if (propList.length > 0) {
        const ids = propList.map(p => p.id)
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .in('property_id', ids)
          .order('created_at', { ascending: true })

        setMessages(msgs || [])
      }

      setDataLoading(false)
    }
    load()
  }, [session])

  async function handleDelete(id) {
    if (!confirm('Delete this property? This cannot be undone.')) return
    const { error } = await supabase.from('properties').delete().eq('id', id)
    if (!error) setProperties(prev => prev.filter(p => p.id !== id))
  }

  // Messages received = messages NOT sent by the landlord
  const receivedMsgs    = messages.filter(m => m.sender_id !== session.user.id)

  // Group all messages by property for the messages tab
  const msgsByProperty  = messages.reduce((acc, m) => {
    if (!acc[m.property_id]) acc[m.property_id] = []
    acc[m.property_id].push(m)
    return acc
  }, {})

  // Build property map for quick lookup
  const propMap = Object.fromEntries(properties.map(p => [p.id, p]))

  // Properties that have at least one message
  const propertiesWithMessages = properties.filter(p => msgsByProperty[p.id]?.length > 0)

  const tabs = [
    { key: 'listings', label: `🏠 My Listings (${properties.length})` },
    { key: 'messages', label: `💬 Messages (${receivedMsgs.length})` },
  ]

  return (
    <div className="page">
      {/* ── Dark header ── */}
      <div className="dashboard-header">
        <div className="container dashboard-header-inner">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                Landlord Dashboard
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.3rem' }}>
                {session.user.email}
              </p>
            </div>
            <Link to="/create-property" className="btn btn-primary">+ Add Property</Link>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div className="container" style={{ display: 'flex' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '1rem 1.5rem', border: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                fontSize: '0.9rem', fontWeight: 600,
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all var(--transition)',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container section">

        {/* ── Listings tab ── */}
        {activeTab === 'listings' && (
          dataLoading ? <LoadingBlock /> :
          properties.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏡</div>
              <h3>No listings yet</h3>
              <p>List your first property and start connecting with tenants.</p>
              <Link to="/create-property" className="btn btn-primary">+ Add your first property</Link>
            </div>
          ) : (
            <>
              <div className="section-header">
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 600 }}>
                  Your Listings
                </h2>
              </div>
              <div className="properties-grid">
                {properties.map(p => (
                  <div key={p.id} className="landlord-property-item">
                    <PropertyCard property={p} />
                    <div className="landlord-property-actions">
                      <Link to={`/property/${p.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                        View listing
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(p.id)}
                      >
                        🗑 Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        )}

        {/* ── Messages tab ── */}
        {activeTab === 'messages' && (
          dataLoading ? <LoadingBlock /> :
          propertiesWithMessages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <h3>No messages yet</h3>
              <p>Tenants will appear here once they reach out about your properties.</p>
            </div>
          ) : (
            <>
              <div className="section-header">
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 600 }}>
                  Tenant Conversations
                </h2>
              </div>

              {propertiesWithMessages.map(prop => {
                const propMsgs = msgsByProperty[prop.id] || []
                // Group by the tenant party for this property
                const byTenant = propMsgs.reduce((acc, m) => {
                  const tenantId = m.sender_id === session.user.id ? m.receiver_id : m.sender_id
                  if (!acc[tenantId]) acc[tenantId] = []
                  acc[tenantId].push(m)
                  return acc
                }, {})

                return (
                  <div key={prop.id} style={{ marginBottom: '2rem' }}>
                    {/* Property header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-dark)', color: '#fff',
                      borderRadius: 'var(--radius) var(--radius) 0 0',
                      flexWrap: 'wrap', gap: '0.5rem',
                    }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600 }}>
                          {prop.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                          📍 {prop.city} · {Object.keys(byTenant).length} tenant{Object.keys(byTenant).length !== 1 ? 's' : ''}
                          , {propMsgs.length} message{propMsgs.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <Link to={`/property/${prop.id}`} className="btn btn-sm"
                        style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none' }}>
                        View listing →
                      </Link>
                    </div>

                    {/* Per-tenant threads */}
                    <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)', overflow: 'hidden' }}>
                      {Object.entries(byTenant).map(([tenantId, msgs], idx) => (
                        <LandlordThread
                          key={tenantId}
                          tenantId={tenantId}
                          messages={msgs}
                          landlordId={session.user.id}
                          propertyId={prop.id}
                          defaultOpen={idx === 0}
                          onReply={async () => {
                            // Refresh messages after reply
                            const ids = properties.map(p => p.id)
                            const { data: fresh } = await supabase
                              .from('messages').select('*')
                              .in('property_id', ids).order('created_at', { ascending: true })
                            setMessages(fresh || [])
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          )
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Expandable landlord ↔ tenant thread with reply box
// ─────────────────────────────────────────────────────────────────
function LandlordThread({ tenantId, messages, landlordId, propertyId, defaultOpen, onReply }) {
  const [open, setOpen]     = useState(defaultOpen)
  const [reply, setReply]   = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  // Auto-scroll when thread opens
  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [open])

  async function handleReply(e) {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      property_id: propertyId,
      sender_id:   landlordId,
      receiver_id: tenantId,
      message:     reply.trim(),
    })
    if (!error) { setReply(''); onReply() }
    else alert('Reply failed: ' + error.message)
    setSending(false)
  }

  const last      = messages[messages.length - 1]
  const lastIsUs  = last?.sender_id === landlordId
  const preview   = last?.message?.slice(0, 55) + (last?.message?.length > 55 ? '…' : '')

  return (
    <div className="thread-item">
      <button className="thread-header" onClick={() => setOpen(o => !o)}>
        <div className="thread-avatar">{tenantId.slice(0, 2).toUpperCase()}</div>
        <div className="thread-meta">
          <div className="thread-tenant-id">Tenant · {tenantId.slice(0, 8)}…</div>
          <div className="thread-preview">
            {lastIsUs && <span style={{ color: 'var(--accent)' }}>You: </span>}
            {preview}
          </div>
        </div>
        <div className="thread-right">
          <span className="thread-count">{messages.length}</span>
          <span className="thread-chevron">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="thread-body">
          <div className="messages-list" style={{ maxHeight: '280px' }}>
            {messages.map(msg => (
              <div key={msg.id}
                className={`message-item ${msg.sender_id === landlordId ? 'sent' : 'received'}`}>
                <div className="message-meta">
                  {msg.sender_id === landlordId ? 'You' : 'Tenant'} · {new Date(msg.created_at).toLocaleString()}
                </div>
                {msg.message}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form className="message-input-area" onSubmit={handleReply}>
            <textarea value={reply} onChange={e => setReply(e.target.value)}
              placeholder="Reply to tenant..." rows={2}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(e) } }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !reply.trim()}>
              {sending ? '...' : 'Reply'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}


// TENANT DASHBOARD
// ─────────────────────────────────────────────────────────────────
function TenantDashboard({ session }) {
  const [threads, setThreads]   = useState([])  // [{ property, messages }]
  const [dataLoading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Fetch all messages this tenant is part of (sender OR receiver)
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order('created_at', { ascending: true })

      const msgList = msgs || []

      // Get unique property IDs
      const propIds = [...new Set(msgList.map(m => m.property_id))]

      if (propIds.length === 0) { setLoading(false); return }

      // Fetch property info
      const { data: props } = await supabase
        .from('properties')
        .select('id, title, city, price, image_url, bedrooms, bathrooms, preferred_tenants, max_occupants')
        .in('id', propIds)

      const propMap = Object.fromEntries((props || []).map(p => [p.id, p]))

      // Group messages by property
      const grouped = msgList.reduce((acc, m) => {
        if (!acc[m.property_id]) acc[m.property_id] = []
        acc[m.property_id].push(m)
        return acc
      }, {})

      // Build threads array sorted by most recently active
      const built = propIds
        .map(id => ({ property: propMap[id], messages: grouped[id] || [] }))
        .filter(t => t.property)  // skip if property was deleted
        .sort((a, b) => {
          const aLast = a.messages[a.messages.length - 1]?.created_at || ''
          const bLast = b.messages[b.messages.length - 1]?.created_at || ''
          return bLast.localeCompare(aLast)
        })

      setThreads(built)
      setLoading(false)
    }
    load()
  }, [session])

  return (
    <div className="page">
      <div className="dashboard-header">
        <div className="container dashboard-header-inner">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 600, color: '#fff', margin: 0 }}>
            My Dashboard
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.3rem' }}>{session.user.email}</p>
        </div>
      </div>

      <div className="container section">
        <div className="section-header">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 600 }}>
            My Conversations
          </h2>
          <Link to="/" className="btn btn-secondary btn-sm">Browse Properties</Link>
        </div>

        {dataLoading ? <LoadingBlock /> :
        threads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <h3>No conversations yet</h3>
            <p>Find a property and message the landlord to get started.</p>
            <Link to="/" className="btn btn-primary">Browse Properties</Link>
          </div>
        ) : (
          threads.map(({ property, messages }) => (
            <TenantThread
              key={property.id}
              property={property}
              messages={messages}
              tenantId={session.user.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Tenant's conversation thread card (full two-way, collapsible)
// ─────────────────────────────────────────────────────────────────
function TenantThread({ property, messages, tenantId }) {
  const [open, setOpen] = useState(true)
  const last = messages[messages.length - 1]

  // Count unread (messages sent by landlord = replies)
  const replyCount = messages.filter(m => m.sender_id !== tenantId).length

  return (
    <div className="tenant-message-card" style={{ marginBottom: '1.25rem' }}>
      {/* Header */}
      <div className="tenant-message-card-header" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div>
            <h4>{property.title}</h4>
            <span>📍 {property.city} · ₹{property.price?.toLocaleString()}/mo</span>
            {replyCount > 0 && (
              <span style={{
                marginLeft: '8px', background: 'var(--accent)', color: '#fff',
                fontSize: '0.72rem', fontWeight: 700, borderRadius: '100px', padding: '1px 7px',
              }}>
                {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link to={`/property/${property.id}`} className="btn btn-secondary btn-sm"
              onClick={e => e.stopPropagation()}>
              View →
            </Link>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{open ? '▲' : '▼'}</span>
          </div>
        </div>
      </div>

      {open && (
        <div className="messages-list" style={{ maxHeight: '280px' }}>
          {messages.map(msg => (
            <div key={msg.id}
              className={`message-item ${msg.sender_id === tenantId ? 'sent' : 'received'}`}>
              <div className="message-meta">
                {msg.sender_id === tenantId ? 'You' : 'Landlord'} · {new Date(msg.created_at).toLocaleString()}
              </div>
              {msg.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────
function LoadingBlock() {
  return (
    <div className="loading-page" style={{ minHeight: '200px' }}>
      <div className="spinner" />
    </div>
  )
}
