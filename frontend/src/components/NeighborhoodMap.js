import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different property types
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

const propertyTypeIcons = {
  single_family: createCustomIcon('#4CAF50'),
  multi_family: createCustomIcon('#2196F3'),
  apartment: createCustomIcon('#FF9800'),
  condo: createCustomIcon('#9C27B0'),
  default: createCustomIcon('#607D8B')
};

// Component to handle map centering
function MapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

const NeighborhoodMap = ({ api, analytics }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'available',
    property_type: '',
    bedrooms: '',
    max_price: ''
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [mapCenter] = useState([36.585901, -79.395096]); // Danville, VA

  useEffect(() => {
    fetchProperties();
    analytics.trackPageView('neighborhood_map');
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.property_type) params.property_type = filters.property_type;
      if (filters.bedrooms) params.bedrooms = parseInt(filters.bedrooms);
      if (filters.max_price) params.max_price = parseFloat(filters.max_price);
      
      const response = await axios.get(`${api}/properties`, { params });
      setProperties(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchProperties();
    analytics.trackButtonClick('apply_property_filters', 'neighborhood_map');
  };

  const formatPrice = (property) => {
    if (property.price) return `$${property.price.toLocaleString()}`;
    if (property.rent) return `$${property.rent.toLocaleString()}/mo`;
    return 'Contact for pricing';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1a202c' }}>
          🗺️ Neighborhood Property Map
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
          Explore available housing opportunities in the Danville area
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Filter Properties</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '0.95rem'
              }}
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Property Type</label>
            <select
              name="property_type"
              value={filters.property_type}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '0.95rem'
              }}
            >
              <option value="">All Types</option>
              <option value="single_family">Single Family</option>
              <option value="multi_family">Multi Family</option>
              <option value="apartment">Apartment</option>
              <option value="condo">Condo</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Min Bedrooms</label>
            <input
              type="number"
              name="bedrooms"
              value={filters.bedrooms}
              onChange={handleFilterChange}
              placeholder="Any"
              min="1"
              max="6"
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '0.95rem'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Max Price</label>
            <input
              type="number"
              name="max_price"
              value={filters.max_price}
              onChange={handleFilterChange}
              placeholder="Any"
              step="10000"
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '0.95rem'
              }}
            />
          </div>
        </div>
        
        <button
          onClick={applyFilters}
          style={{
            marginTop: '1rem',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
            color: 'white',
            padding: '0.75rem 2rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          Apply Filters
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          Loading properties...
        </div>
      )}

      {error && (
        <div style={{
          background: '#FEE2E2',
          color: '#991B1B',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', lg: { gridTemplateColumns: '2fr 1fr' }, gap: '2rem' }}>
          {/* Map */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            height: '600px'
          }}>
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapCenter center={mapCenter} />
              
              {properties.map((property) => (
                <Marker
                  key={property.id}
                  position={[property.latitude, property.longitude]}
                  icon={propertyTypeIcons[property.property_type] || propertyTypeIcons.default}
                  eventHandlers={{
                    click: () => {
                      setSelectedProperty(property);
                      analytics.trackButtonClick(`property_marker_${property.id}`, 'neighborhood_map');
                    }
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: '250px' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {property.title}
                      </h3>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        {property.address}, {property.city}
                      </p>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                        {formatPrice(property)}
                      </p>
                      <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        🛏️ {property.bedrooms} bed • 🚿 {property.bathrooms} bath
                      </p>
                      <button
                        onClick={() => setSelectedProperty(property)}
                        style={{
                          background: 'var(--color-primary)',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          width: '100%',
                          marginTop: '0.5rem'
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Property List / Details */}
          <div>
            {selectedProperty ? (
              <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <button
                  onClick={() => setSelectedProperty(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                    marginBottom: '1rem',
                    fontSize: '0.9rem'
                  }}
                >
                  ← Back to list
                </button>
                
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                  {selectedProperty.title}
                </h2>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                    {formatPrice(selectedProperty)}
                  </p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                    📍 {selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip_code}
                  </p>
                </div>
                
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f7fafc', borderRadius: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Bedrooms</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>🛏️ {selectedProperty.bedrooms}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Bathrooms</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>🚿 {selectedProperty.bathrooms}</p>
                    </div>
                    {selectedProperty.square_feet && (
                      <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Square Feet</p>
                        <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>📐 {selectedProperty.square_feet.toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Type</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                        {selectedProperty.property_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Description</h3>
                  <p style={{ color: 'var(--color-text-primary)', lineHeight: '1.6' }}>{selectedProperty.description}</p>
                </div>
                
                {selectedProperty.features && selectedProperty.features.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Features</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {selectedProperty.features.map((feature, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: '#e6f2ff',
                            color: 'var(--color-primary)',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedProperty.program_type && (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <p style={{ color: '#166534', fontSize: '0.9rem', fontWeight: '500' }}>
                      ✓ Qualifies for {selectedProperty.program_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Program
                    </p>
                  </div>
                )}
                
                <div style={{
                  padding: '1.5rem',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Contact Information</h3>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    {selectedProperty.contact_name || 'DNDC Housing Team'}
                  </p>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    📞 {selectedProperty.contact_phone || '434-555-0150'}
                  </p>
                  <p style={{ fontSize: '0.9rem' }}>
                    ✉️ {selectedProperty.contact_email || 'housing@dndcva.org'}
                  </p>
                </div>
                
                <button
                  onClick={() => analytics.trackButtonClick(`contact_property_${selectedProperty.id}`, 'neighborhood_map')}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                >
                  Contact About This Property
                </button>
              </div>
            ) : (
              <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                maxHeight: '600px',
                overflowY: 'auto'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                  Available Properties ({properties.length})
                </h3>
                
                {properties.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem' }}>
                    No properties match your filters.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {properties.map((property) => (
                      <div
                        key={property.id}
                        onClick={() => {
                          setSelectedProperty(property);
                          analytics.trackButtonClick(`select_property_${property.id}`, 'neighborhood_map');
                        }}
                        style={{
                          padding: '1rem',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-primary)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.2)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                          {property.title}
                        </h4>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                          {property.address}, {property.city}
                        </p>
                        <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                          {formatPrice(property)}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                          🛏️ {property.bedrooms} bed • 🚿 {property.bathrooms} bath
                          {property.square_feet && ` • 📐 ${property.square_feet.toLocaleString()} sq ft`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginTop: '2rem'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Map Legend</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#4CAF50' }}></div>
            <span style={{ fontSize: '0.9rem' }}>Single Family</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#2196F3' }}></div>
            <span style={{ fontSize: '0.9rem' }}>Multi Family</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#FF9800' }}></div>
            <span style={{ fontSize: '0.9rem' }}>Apartment</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#9C27B0' }}></div>
            <span style={{ fontSize: '0.9rem' }}>Condo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodMap;