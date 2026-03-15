// src/components/MessageBox.jsx
// Two-way messaging between tenants and landlords.
//
// Tenant view:  single thread with the landlord for this property.
// Landlord view: list of all tenants who messaged, each as an
//                expandable conversation with a reply box.

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ─────────────────────────────────────────────────────────────────
// Main export — routes to the right view based on role
// ─────────────────────────────────────────────────────────────────
export default function MessageBox({ propertyId, landlordId }) {
  const { session, profile } = useAuth()

  if (!session) {
    return (
      <div className="message-box">
        <div className="message-box-header">💬 Contact Landlord</div>
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Please <a href="/login" style={{ color: 'var(--accent)' }}>log in</a> to message the landlord.
        </div>
      </div>
    )
  }

  // Landlord viewing their own property
  if (session.user.id === landlordId) {
    return <LandlordInbox propertyId={propertyId} landlordId={landlordId} />
  }

  // Tenant (or any other logged-in user) viewing the property
  return <TenantThread propertyId={propertyId} landlordId={landlordId} session={session} />
}

// ─────────────────────────────────────────────────────────────────
// Tenant: single conversation thread with the landlord
// ─────────────────────────────────────────────────────────────────
function TenantThread({ propertyId, landlordId, session }) {
  const [messages, setMessages] = useState([])
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => { loadMessages() }, [propertyId])

  async function loadMessages() {
    setLoading(true)
    const userId = session.user.id
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('property_id', propertyId)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true })

    setMessages(data || [])
    setLoading(false)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)

    const { error } = await supabase.from('messages').insert({
      property_id: propertyId,
      sender_id:   session.user.id,
      receiver_id: landlordId,
      message:     text.trim(),
    })

    if (!error) { setText(''); loadMessages() }
    else alert('Could not send: ' + error.message)
    setSending(false)
  }

  return (
    <div className="message-box">
      <div className="message-box-header">💬 Message Landlord</div>

      <div className="messages-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem', fontSize: '0.88rem' }}>
            No messages yet — send one below!
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id}
              className={`message-item ${msg.sender_id === session.user.id ? 'sent' : 'received'}`}>
              <div className="message-meta">
                {msg.sender_id === session.user.id ? 'You' : 'Landlord'} · {new Date(msg.created_at).toLocaleString()}
              </div>
              {msg.message}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form className="message-input-area" onSubmit={handleSend}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type your message..."
          rows={2}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) }
          }}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !text.trim()}>
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Landlord: inbox grouped by tenant, each thread is expandable
// with a reply box
// ─────────────────────────────────────────────────────────────────
function LandlordInbox({ propertyId, landlordId }) {
  const [allMessages, setAllMessages] = useState([])
  const [loading, setLoading]         = useState(true)
  // Track which tenant thread is open: tenantId | null
  const [openThread, setOpenThread]   = useState(null)

  useEffect(() => { loadAll() }, [propertyId])

  async function loadAll() {
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: true })

    setAllMessages(data || [])
    setLoading(false)
  }

  // Group messages by the tenant (the non-landlord party)
  const threads = allMessages.reduce((acc, msg) => {
    const tenantId = msg.sender_id === landlordId ? msg.receiver_id : msg.sender_id
    if (!acc[tenantId]) acc[tenantId] = []
    acc[tenantId].push(msg)
    return acc
  }, {})

  const tenantIds = Object.keys(threads)

  return (
    <div className="message-box">
      <div className="message-box-header">
        📨 Tenant Messages
        {tenantIds.length > 0 && (
          <span style={{
            marginLeft: '8px', background: 'var(--accent)', color: '#fff',
            borderRadius: '100px', padding: '1px 8px', fontSize: '0.75rem',
          }}>
            {tenantIds.length}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : tenantIds.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem', fontSize: '0.88rem' }}>
          No messages yet. Tenants will appear here.
        </div>
      ) : (
        <div className="landlord-threads">
          {tenantIds.map(tenantId => (
            <TenantConversation
              key={tenantId}
              tenantId={tenantId}
              messages={threads[tenantId]}
              landlordId={landlordId}
              propertyId={propertyId}
              isOpen={openThread === tenantId}
              onToggle={() => setOpenThread(prev => prev === tenantId ? null : tenantId)}
              onReply={loadAll}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Single expandable tenant conversation inside the landlord inbox
// ─────────────────────────────────────────────────────────────────
function TenantConversation({ tenantId, messages, landlordId, propertyId, isOpen, onToggle, onReply }) {
  const [reply, setReply]   = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [isOpen, messages])

  const lastMsg    = messages[messages.length - 1]
  const lastIsUs   = lastMsg?.sender_id === landlordId
  const preview    = lastMsg?.message?.slice(0, 60) + (lastMsg?.message?.length > 60 ? '…' : '')

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
    else alert('Could not send reply: ' + error.message)
    setSending(false)
  }

  return (
    <div className="thread-item">
      {/* Thread header — click to expand/collapse */}
      <button className="thread-header" onClick={onToggle}>
        <div className="thread-avatar">
          {tenantId.slice(0, 2).toUpperCase()}
        </div>
        <div className="thread-meta">
          <div className="thread-tenant-id">Tenant · {tenantId.slice(0, 8)}…</div>
          <div className="thread-preview">
            {lastIsUs ? <span style={{ color: 'var(--accent)' }}>You: </span> : ''}
            {preview}
          </div>
        </div>
        <div className="thread-right">
          <span className="thread-count">{messages.length}</span>
          <span className="thread-chevron">{isOpen ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded thread body */}
      {isOpen && (
        <div className="thread-body">
          <div className="messages-list" style={{ maxHeight: '260px' }}>
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

          {/* Reply box */}
          <form className="message-input-area" onSubmit={handleReply}>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Reply to tenant..."
              rows={2}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(e) }
              }}
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
