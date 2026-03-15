// src/components/PropertyCard.jsx

import { useNavigate } from 'react-router-dom'

function propertyEmoji(bedrooms) {
  if (bedrooms >= 4) return '🏡'
  if (bedrooms >= 2) return '🏘️'
  return '🏠'
}

const TENANT_LABELS = {
  girls:  { label: 'Girls only',   icon: '👩' },
  boys:   { label: 'Boys only',    icon: '👨' },
  family: { label: 'Family',       icon: '👨‍👩‍👧' },
  any:    { label: 'All welcome',  icon: '👥' },
}

export default function PropertyCard({ property }) {
  const navigate = useNavigate()
  const tenantInfo = TENANT_LABELS[property.preferred_tenants] || TENANT_LABELS['any']

  return (
    <div className="property-card" onClick={() => navigate(`/property/${property.id}`)}>
      {/* Image */}
      <div className="property-card-img">
        {property.image_url ? (
          <img src={property.image_url} alt={property.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          propertyEmoji(property.bedrooms)
        )}
        <span className="property-card-badge">For Rent</span>

        {/* Tenant type badge top-right */}
        {property.preferred_tenants && property.preferred_tenants !== 'any' && (
          <span className="property-card-tenant-badge">
            {tenantInfo.icon} {tenantInfo.label}
          </span>
        )}
      </div>

      <div className="property-card-body">
        <div className="property-card-city">{property.city}</div>
        <div className="property-card-title">{property.title}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          📍 {property.address}
        </div>

        <div className="property-card-price">
          ₹{property.price.toLocaleString()}
          <span> / month</span>
        </div>

        <div className="property-card-meta">
          <div className="property-card-meta-item">🛏️ {property.bedrooms} bed</div>
          <div className="property-card-meta-item">🚿 {property.bathrooms} bath</div>
          {property.max_occupants && (
            <div className="property-card-meta-item">👥 max {property.max_occupants}</div>
          )}
        </div>
      </div>

      <div className="property-card-footer">
        <button
          className="btn btn-primary btn-full btn-sm"
          onClick={e => { e.stopPropagation(); navigate(`/property/${property.id}`) }}
        >
          View Details →
        </button>
      </div>
    </div>
  )
}
