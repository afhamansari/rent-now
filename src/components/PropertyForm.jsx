// src/components/PropertyForm.jsx
// Property create form with cover image + additional photos upload.

import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY = {
  title: '', description: '', price: '',
  city: '', address: '', bedrooms: '', bathrooms: '',
  preferred_tenants: 'any', max_occupants: '', other_requirements: '',
}

const TENANT_OPTIONS = [
  { value: 'any',    label: 'Any',    icon: '👥' },
  { value: 'girls',  label: 'Girls',  icon: '👩' },
  { value: 'boys',   label: 'Boys',   icon: '👨' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧' },
]

async function uploadToStorage(file) {
  const ext      = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const path     = `properties/${filename}`

  const { error } = await supabase.storage
    .from('images')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return data.publicUrl
}

export default function PropertyForm({ initial = {}, onSubmit, loading }) {
  const [form, setForm]   = useState({ ...EMPTY, ...initial })
  const [error, setError] = useState('')

  // Cover image
  const [coverFile, setCoverFile]       = useState(null)
  const [coverPreview, setCoverPreview] = useState(initial.image_url || null)

  // Additional photos: array of { file, preview } for new ones + existing URLs
  const [extraFiles, setExtraFiles]     = useState([])   // new File objects to upload
  const [extraPreviews, setExtraPreviews] = useState([]) // local object URLs for preview

  const [uploading, setUploading] = useState(false)

  const coverRef = useRef(null)
  const extraRef = useRef(null)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleCoverChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  function handleExtraChange(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setExtraFiles(prev => [...prev, ...files])
    setExtraPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
    // Reset the input so the same file can be re-selected if needed
    e.target.value = ''
  }

  function removeExtra(idx) {
    setExtraFiles(prev => prev.filter((_, i) => i !== idx))
    setExtraPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const required = ['title', 'description', 'price', 'city', 'address', 'bedrooms', 'bathrooms']
    for (const field of required) {
      if (!form[field]) { setError(`Missing field: ${field}`); return }
    }

    setUploading(true)

    // 1. Upload cover image if changed
    let image_url = initial.image_url || null
    if (coverFile) {
      try { image_url = await uploadToStorage(coverFile) }
      catch (err) { setError('Cover upload failed: ' + err.message); setUploading(false); return }
    }

    // 2. Upload extra photos
    let extraUrls = []
    for (const file of extraFiles) {
      try { extraUrls.push(await uploadToStorage(file)) }
      catch (err) { setError('Photo upload failed: ' + err.message); setUploading(false); return }
    }

    setUploading(false)

    await onSubmit({
      ...form,
      price:             parseInt(form.price, 10),
      bedrooms:          parseInt(form.bedrooms, 10),
      bathrooms:         parseInt(form.bathrooms, 10),
      max_occupants:     form.max_occupants ? parseInt(form.max_occupants, 10) : null,
      other_requirements: form.other_requirements.trim() || null,
      image_url,
      extraPhotoUrls: extraUrls,  // passed to CreateProperty to insert into property_photos
    })
  }

  const isBusy = loading || uploading

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      {/* ── Cover photo ── */}
      <div className="form-group">
        <label>Cover Photo <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(shown on listing card)</span></label>
        <div className="image-upload-zone" onClick={() => coverRef.current?.click()}>
          {coverPreview ? (
            <div className="image-preview-wrap">
              <img src={coverPreview} alt="Cover" className="image-preview" />
              <div className="image-preview-overlay">Click to change</div>
            </div>
          ) : (
            <div className="image-upload-placeholder">
              <div className="image-upload-icon">📷</div>
              <div className="image-upload-text">Click to upload cover photo</div>
              <div className="image-upload-hint">JPG, PNG, WEBP — max 5 MB</div>
            </div>
          )}
        </div>
        <input ref={coverRef} type="file" accept="image/*"
          style={{ display: 'none' }} onChange={handleCoverChange} />
      </div>

      {/* ── Additional photos ── */}
      <div className="form-group">
        <label>Additional Photos <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(shown in gallery on listing page)</span></label>

        {/* Preview grid of selected extras */}
        {extraPreviews.length > 0 && (
          <div className="extra-photos-grid">
            {extraPreviews.map((src, idx) => (
              <div key={idx} className="extra-photo-thumb">
                <img src={src} alt={`Photo ${idx + 1}`} />
                <button type="button" className="extra-photo-remove" onClick={() => removeExtra(idx)}>✕</button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ marginTop: extraPreviews.length ? '0.75rem' : 0 }}
          onClick={() => extraRef.current?.click()}
        >
          + Add Photos
        </button>
        <input ref={extraRef} type="file" accept="image/*" multiple
          style={{ display: 'none' }} onChange={handleExtraChange} />
      </div>

      <div className="form-group">
        <label>Property Title</label>
        <input name="title" value={form.title} onChange={handleChange}
          placeholder="e.g. Spacious 2BHK in Koramangala" />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea name="description" value={form.description} onChange={handleChange}
          placeholder="Describe the property, amenities, nearby facilities..." rows={4} />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Monthly Rent (₹)</label>
          <input name="price" type="number" value={form.price} onChange={handleChange}
            placeholder="e.g. 25000" min="0" />
        </div>
        <div className="form-group">
          <label>City</label>
          <input name="city" value={form.city} onChange={handleChange}
            placeholder="e.g. Bangalore" />
        </div>
      </div>

      <div className="form-group">
        <label>Full Address</label>
        <input name="address" value={form.address} onChange={handleChange}
          placeholder="e.g. 14, 5th Cross, Koramangala 4th Block" />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Bedrooms</label>
          <input name="bedrooms" type="number" value={form.bedrooms} onChange={handleChange}
            placeholder="e.g. 2" min="0" max="20" />
        </div>
        <div className="form-group">
          <label>Bathrooms</label>
          <input name="bathrooms" type="number" value={form.bathrooms} onChange={handleChange}
            placeholder="e.g. 2" min="0" max="20" />
        </div>
      </div>

      {/* ── Tenant Requirements ── */}
      <div className="form-section-divider"><span>Tenant Requirements</span></div>

      <div className="form-group">
        <label>Preferred Tenants</label>
        <div className="pill-selector">
          {TENANT_OPTIONS.map(opt => (
            <button key={opt.value} type="button"
              className={`pill-option ${form.preferred_tenants === opt.value ? 'selected' : ''}`}
              onClick={() => setForm(prev => ({ ...prev, preferred_tenants: opt.value }))}>
              <span>{opt.icon}</span> {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Max Occupants Allowed</label>
        <input name="max_occupants" type="number" value={form.max_occupants}
          onChange={handleChange} placeholder="e.g. 3 (leave blank for no limit)"
          min="1" max="20" />
      </div>

      <div className="form-group">
        <label>Other Requirements</label>
        <textarea name="other_requirements" value={form.other_requirements}
          onChange={handleChange}
          placeholder="e.g. No pets, vegetarians preferred, working professionals only..."
          rows={3} />
      </div>

      <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isBusy}>
        {uploading ? 'Uploading photos...' : loading ? 'Saving...' : 'List Property'}
      </button>
    </form>
  )
}
