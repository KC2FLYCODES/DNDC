import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ResourcesTab = ({ api }) => {
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
      <div className="search-box">
        <input
          type="text"
          placeholder="Search resources..."
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
      
      <div className="resource-list">
        {filteredResources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No resources found matching your criteria.
          </div>
        ) : (
          filteredResources.map(resource => (
            <div key={resource.id} className="resource-item">
              <div className="resource-name">{resource.name}</div>
              <div className="resource-detail">{resource.description}</div>
              {resource.eligibility && (
                <div className="resource-detail">Eligibility: {resource.eligibility}</div>
              )}
              {resource.hours && (
                <div className="resource-detail">{resource.hours}</div>
              )}
              {resource.phone && (
                <a href={`tel:${resource.phone}`} className="resource-phone">
                  📞 {resource.phone}
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ResourcesTab;