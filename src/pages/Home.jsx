// src/pages/Home.jsx
// Landing page: hero section + searchable, filterable, sortable property listings.

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PropertyCard from '../components/PropertyCard'

const TENANT_TYPE_OPTIONS = [
  { value: '',       label: 'Any type' },
  { value: 'girls',  label: '👩 Girls' },
  { value: 'boys',   label: '👨 Boys' },
  { value: 'family', label: '👨‍👩‍👧 Family' },
]

export default function Home() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading]       = useState(true)

  // ── Filter / sort state ───────────────────────────────────────────
  const [search, setSearch]         = useState('')
  const [sortBy, setSortBy]         = useState('newest')
  const [filterType, setFilterType] = useState('')   // girls | boys | family | '' (any)
  const [filterPeople, setFilterPeople] = useState('') // number of people

  // Track whether the filter panel is expanded on mobile
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => { loadProperties() }, [])

  async function loadProperties() {
    setLoading(true)
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setProperties(data || [])
    setLoading(false)
  }

  // ── Client-side filtering ─────────────────────────────────────────
  const filtered = properties.filter(p => {
    // Text search
    const matchSearch =
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase())

    // Tenant type: property must allow this type OR be set to 'any'
    const matchType =
      !filterType ||
      p.preferred_tenants === filterType ||
      p.preferred_tenants === 'any' ||
      !p.preferred_tenants

    // Number of people: property's max_occupants must be >= requested, or have no limit
    const people = parseInt(filterPeople, 10)
    const matchPeople =
      !filterPeople ||
      isNaN(people) ||
      !p.max_occupants ||
      p.max_occupants >= people

    return matchSearch && matchType && matchPeople
  })

  // ── Sort ──────────────────────────────────────────────────────────
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price_asc')  return a.price - b.price
    if (sortBy === 'price_desc') return b.price - a.price
    return 0
  })

  const hasActiveFilters = filterType || filterPeople

  function clearFilters() {
    setFilterType('')
    setFilterPeople('')
    setSearch('')
    setSortBy('newest')
  }

  return (
    <div className="page">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="container">
          <div className="hero-inner" style={{ gridTemplateColumns: '1fr' }}>
            <div className="hero-text" style={{ maxWidth: '620px' }}>
              <div className="hero-kicker">🏠 Rentals Made Simple</div>
              <h1>Find Your Next<br /><em>Perfect Home</em></h1>
              <p>
                Browse verified rentals across India. Connect directly with
                landlords — no middlemen, no hidden fees.
              </p>

              {/* ── Primary search bar ── */}
              <div className="search-bar" style={{ marginTop: '2rem' }}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by city or title..."
                />
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="price_desc">Price ↓</option>
                </select>
                <button className="btn btn-primary btn-sm"
                  style={{ borderRadius: '100px', marginRight: '4px' }}>
                  Search
                </button>
              </div>

              {/* Stats */}
              <div className="hero-stats">
                <div>
                  <div className="hero-stat-num">{properties.length}+</div>
                  <div className="hero-stat-label">Listings</div>
                </div>
                <div>
                  <div className="hero-stat-num">100%</div>
                  <div className="hero-stat-label">Direct Contact</div>
                </div>
                <div>
                  <div className="hero-stat-num">₹0</div>
                  <div className="hero-stat-label">Brokerage</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Listings ── */}
      <section className="section">
        <div className="container">

          {/* ── Filter bar ── */}
          <div className="filter-bar">
            <div className="filter-bar-left">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {search ? `"${search}"` : 'All Properties'}
              </h2>
              <span className="filter-count">
                {sorted.length} {sorted.length === 1 ? 'listing' : 'listings'}
              </span>
            </div>

            <div className="filter-bar-right">
              {/* Tenant type pills */}
              <div className="filter-group">
                <div className="filter-pills">
                  {TENANT_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`filter-pill ${filterType === opt.value ? 'active' : ''}`}
                      onClick={() => setFilterType(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of people */}
              <div className="filter-group">
                <span className="filter-label">People</span>
                <input
                  className="filter-number-input"
                  type="number"
                  value={filterPeople}
                  onChange={e => setFilterPeople(e.target.value)}
                  placeholder="How many?"
                  min="1" max="20"
                />
              </div>

              {/* Clear */}
              {hasActiveFilters && (
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                  ✕ Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Active filter summary chips */}
          {hasActiveFilters && (
            <div className="active-filters">
              {filterType && (
                <span className="active-filter-chip">
                  {TENANT_TYPE_OPTIONS.find(o => o.value === filterType)?.label}
                  <button onClick={() => setFilterType('')}>✕</button>
                </span>
              )}
              {filterPeople && (
                <span className="active-filter-chip">
                  {filterPeople} {parseInt(filterPeople) === 1 ? 'person' : 'people'}
                  <button onClick={() => setFilterPeople('')}>✕</button>
                </span>
              )}
            </div>
          )}

          {/* ── Results ── */}
          {loading ? (
            <div className="loading-page" style={{ minHeight: '300px' }}>
              <div className="spinner" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No properties found</h3>
              <p>
                {hasActiveFilters || search
                  ? 'Try adjusting or clearing your filters.'
                  : 'Be the first to list a property!'}
              </p>
              {(hasActiveFilters || search) && (
                <button className="btn btn-primary" onClick={clearFilters}>
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="properties-grid">
              {sorted.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
