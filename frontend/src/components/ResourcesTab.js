import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ResourcesTab = ({ api, analytics }) => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = [
    { id: 'housing', name: 'Housing Help', icon: '🏠' },
    { id: 'utilities', name: 'Utilities', icon: '💡' },
    { id: 'food', name: 'Food Banks', icon: '🥫' },
    { id: 'health', name: 'Healthcare', icon: '🏥' }
  ];

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [resources, searchTerm, selectedCategory]);

  const fetchResources = async (category = '') => {
    try {
      setLoading(true);
      const url = category ? `${api}/resources?category=${category}` : `${api}/resources`;
      const response = await axios.get(url);
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
    setSelectedCategory(selectedCategory === categoryId ? '' : categoryId);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
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
          <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
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
              borderBottom: '1px solid #e2e8f0',
              fontWeight: '600',
              color: '#4a5568'
            }}>
              {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''} found
              {selectedCategory && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
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