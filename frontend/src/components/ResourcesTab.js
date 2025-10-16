import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DNDC_ORG_ID = "97fef08b-4fde-484d-b334-4b9450f9a280";

const ResourcesTab = ({ api, analytics }) => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useSupabase, setUseSupabase] = useState(false);

  const categories = [
    { id: 'housing', name: 'Housing Help', icon: '🏠' },
    { id: 'utilities', name: 'Utilities', icon: '💡' },
    { id: 'food', name: 'Food Banks', icon: '🥫' },
    { id: 'health', name: 'Healthcare', icon: '🏥' }
  ];

  useEffect(() => {
    fetchResources();
  }, [useSupabase]);

  useEffect(() => {
    filterResources();
  }, [resources, searchTerm, selectedCategory]);

  const fetchResources = async (category = '') => {
    try {
      setLoading(true);
      
      // Use Supabase multi-tenant endpoint or MongoDB endpoint
      const endpoint = useSupabase 
        ? `${api}/dndc/resources${category ? `?category=${category}` : ''}`
        : `${api}/resources${category ? `?category=${category}` : ''}`;
        
      const response = await axios.get(endpoint);
      setResources(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load resources');
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    if (selectedCategory) {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredResources(filtered);
  };

  const handleCategoryClick = (categoryId) => {
    const newCategory = selectedCategory === categoryId ? '' : categoryId;
    setSelectedCategory(newCategory);
    
    // Track category filter usage
    if (analytics) {
      analytics.trackButtonClick(`category_${categoryId}`, 'resources');
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    
    // Track search usage with debouncing
    if (analytics && e.target.value.length > 2) {
      setTimeout(() => {
        analytics.trackSearch(e.target.value, 'resources', filteredResources.length);
      }, 500);
    }
  };

  if (loading) {
    return <div className="loading">Loading resources...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Community Resources</h3>
            <p className="card-subtitle">Find housing assistance, utilities help, and community services</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              <input
                type="checkbox"
                checked={useSupabase}
                onChange={(e) => setUseSupabase(e.target.checked)}
                style={{ marginRight: '5px' }}
              />
              Multi-tenant (Supabase)
            </label>
          </div>
        </div>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="Search resources by name or service..."
            className="search-input"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="category-grid">
          {categories.map(category => (
            <div
              key={category.id}
              className={`category-card ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="category-icon">{category.icon}</div>
              <div className="category-name">{category.name}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="resource-list">
        {filteredResources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              No resources found
            </div>
            <div>Try adjusting your search terms or category filter</div>
          </div>
        ) : (
          <>
            <div style={{ 
              padding: '1rem 1.5rem', 
              background: '#f7fafc', 
              borderBottom: '1px solid var(--color-border)',
              fontWeight: '600',
              color: 'var(--color-text-primary)'
            }}>
              {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''} found
              {selectedCategory && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
              {useSupabase && <span style={{ color: 'var(--color-primary)', marginLeft: '10px' }}>(Multi-tenant)</span>}
            </div>
            {filteredResources.map(resource => (
              <div key={resource.id} className="resource-item">
                <div className="resource-name">{resource.name}</div>
                <div className="resource-detail">{resource.description}</div>
                {resource.eligibility && (
                  <div className="resource-detail">
                    <strong>Eligibility:</strong> {resource.eligibility}
                  </div>
                )}
                {resource.hours && (
                  <div className="resource-detail">
                    <strong>Hours:</strong> {resource.hours}
                  </div>
                )}
                {resource.phone && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <a href={`tel:${resource.phone}`} className="resource-phone">
                      📞 {resource.phone}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ResourcesTab;