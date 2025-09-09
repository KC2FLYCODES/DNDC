import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = ({ api, onLogout }) => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [applications, setApplications] = useState([]);
  const [resources, setResources] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceForm, setResourceForm] = useState({
    name: '',
    description: '',
    category: 'housing',
    phone: '',
    address: '',
    hours: '',
    eligibility: ''
  });

  const adminTabs = [
    { id: 'analytics', label: 'Analytics Dashboard', icon: '📊' },
    { id: 'applications', label: 'Application Management', icon: '📋' },
    { id: 'resources', label: 'Resource Management', icon: '🏘️' },
    { id: 'messages', label: 'Contact Messages', icon: '💬' }
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAnalytics(),
        fetchApplications(),
        fetchResources(),
        fetchMessages()
      ]);
    } catch (err) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${api}/analytics/dashboard`);
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${api}/admin/applications`);
      setApplications(response.data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await axios.get(`${api}/admin/resources`);
      setResources(response.data);
    } catch (err) {
      console.error('Error fetching resources:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${api}/admin/messages`);
      setMessages(response.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const updateApplicationStatus = async (applicationId, status, notes = '') => {
    try {
      await axios.put(`${api}/admin/applications/${applicationId}/status`, null, {
        params: { status, notes }
      });
      await fetchApplications();
      setError(null);
    } catch (err) {
      setError('Failed to update application status');
    }
  };

  const updateMessageStatus = async (messageId, status) => {
    try {
      await axios.put(`${api}/admin/messages/${messageId}/status`, null, {
        params: { status }
      });
      await fetchMessages();
      setError(null);
    } catch (err) {
      setError('Failed to update message status');
    }
  };

  const exportApplications = async () => {
    try {
      const response = await axios.get(`${api}/admin/export/applications`);
      const csv = convertToCSV(response.data);
      downloadCSV(csv, 'applications_export.csv');
    } catch (err) {
      setError('Failed to export applications');
    }
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => `"${row[header] || ''}"`).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    
    if (!resourceForm.name.trim() || !resourceForm.description.trim()) {
      setError('Name and description are required');
      return;
    }

    try {
      setLoading(true);
      
      if (editingResource) {
        // Update existing resource
        await axios.put(`${api}/admin/resources/${editingResource.id}`, resourceForm);
      } else {
        // Create new resource
        await axios.post(`${api}/resources`, resourceForm);
      }
      
      await fetchResources();
      setShowResourceForm(false);
      setEditingResource(null);
      setResourceForm({
        name: '',
        description: '',
        category: 'housing',
        phone: '',
        address: '',
        hours: '',
        eligibility: ''
      });
      setError(null);
    } catch (err) {
      setError(`Failed to ${editingResource ? 'update' : 'create'} resource`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditResource = (resource) => {
    setEditingResource(resource);
    setResourceForm({
      name: resource.name,
      description: resource.description,
      category: resource.category,
      phone: resource.phone || '',
      address: resource.address || '',
      hours: resource.hours || '',
      eligibility: resource.eligibility || ''
    });
    setShowResourceForm(true);
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      await axios.delete(`${api}/admin/resources/${resourceId}`);
      await fetchResources();
      setError(null);
    } catch (err) {
      setError('Failed to delete resource');
    }
  };

  const resetResourceForm = () => {
    setShowResourceForm(false);
    setEditingResource(null);
    setResourceForm({
      name: '',
      description: '',
      category: 'housing',
      phone: '',
      address: '',
      hours: '',
      eligibility: ''
    });
    setError(null);
  };

  const renderAnalytics = () => (
    <div>
      <div className="admin-header">
        <h3>Analytics Dashboard</h3>
        <p>Overview of platform usage and metrics</p>
      </div>
      
      {analytics && (
        <div className="analytics-grid">
          <div className="metric-card">
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <div className="metric-value">{analytics.applications.total}</div>
              <div className="metric-label">Total Applications</div>
              <div className="metric-sub">
                {analytics.applications.completion_rate.toFixed(1)}% completion rate
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">📄</div>
            <div className="metric-content">
              <div className="metric-value">{analytics.documents.uploaded}</div>
              <div className="metric-label">Documents Uploaded</div>
              <div className="metric-sub">
                {analytics.documents.upload_rate.toFixed(1)}% upload rate
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <div className="metric-value">{analytics.calculators.total_calculations}</div>
              <div className="metric-label">Calculator Uses</div>
              <div className="metric-sub">Last 30 days</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">💬</div>
            <div className="metric-content">
              <div className="metric-value">{analytics.engagement.recent_messages}</div>
              <div className="metric-label">Recent Messages</div>
              <div className="metric-sub">Last 30 days</div>
            </div>
          </div>
        </div>
      )}
      
      {analytics?.popular_pages && analytics.popular_pages.length > 0 && (
        <div className="analytics-section">
          <h4>Most Popular Pages</h4>
          <div className="popular-pages">
            {analytics.popular_pages.map((page, index) => (
              <div key={index} className="page-stat">
                <span className="page-name">{page._id}</span>
                <span className="page-count">{page.count} views</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderApplications = () => (
    <div>
      <div className="admin-header">
        <h3>Application Management</h3>
        <div className="admin-actions">
          <button className="btn-primary" onClick={exportApplications}>
            📥 Export CSV
          </button>
        </div>
      </div>
      
      <div className="applications-table">
        {applications.map(app => (
          <div key={app.id} className="application-admin-card">
            <div className="app-admin-header">
              <div>
                <h4>{app.applicant_name}</h4>
                <p>{app.applicant_email || 'No email provided'}</p>
              </div>
              <div className="app-admin-status">
                <select
                  value={app.status}
                  onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                  className="status-select"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                </select>
              </div>
            </div>
            
            <div className="app-admin-details">
              <div className="detail-item">
                <strong>Progress:</strong> {app.progress_percentage}%
              </div>
              <div className="detail-item">
                <strong>Documents:</strong> {app.completed_documents?.length || 0} of {app.required_documents?.length || 0}
              </div>
              <div className="detail-item">
                <strong>Created:</strong> {new Date(app.created_at).toLocaleDateString()}
              </div>
              {app.notes && (
                <div className="detail-item">
                  <strong>Notes:</strong> {app.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderResources = () => (
    <div>
      <div className="admin-header">
        <div>
          <h3>Resource Management</h3>
          <p>Manage community resources and services</p>
        </div>
        <div className="admin-actions">
          <button 
            className="btn-primary" 
            onClick={() => setShowResourceForm(true)}
          >
            ➕ Add New Resource
          </button>
        </div>
      </div>
      
      {showResourceForm && (
        <div className="resource-form-modal">
          <div className="resource-form-content">
            <div className="resource-form-header">
              <h4>{editingResource ? 'Edit Resource' : 'Add New Resource'}</h4>
              <button 
                className="close-btn" 
                onClick={resetResourceForm}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#718096'
                }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleResourceSubmit} className="resource-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Resource Name *</label>
                  <input
                    type="text"
                    value={resourceForm.name}
                    onChange={(e) => setResourceForm({...resourceForm, name: e.target.value})}
                    placeholder="Enter resource name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={resourceForm.category}
                    onChange={(e) => setResourceForm({...resourceForm, category: e.target.value})}
                    required
                  >
                    <option value="housing">Housing Help</option>
                    <option value="utilities">Utilities</option>
                    <option value="food">Food Banks</option>
                    <option value="health">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="employment">Employment</option>
                    <option value="legal">Legal Services</option>
                    <option value="transportation">Transportation</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm({...resourceForm, description: e.target.value})}
                  placeholder="Describe the resource and services offered"
                  rows="3"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={resourceForm.phone}
                    onChange={(e) => setResourceForm({...resourceForm, phone: e.target.value})}
                    placeholder="(434) 555-0123"
                  />
                </div>
                
                <div className="form-group">
                  <label>Hours of Operation</label>
                  <input
                    type="text"
                    value={resourceForm.hours}
                    onChange={(e) => setResourceForm({...resourceForm, hours: e.target.value})}
                    placeholder="Mon-Fri 9am-5pm"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={resourceForm.address}
                  onChange={(e) => setResourceForm({...resourceForm, address: e.target.value})}
                  placeholder="123 Main Street, City, State 12345"
                />
              </div>
              
              <div className="form-group">
                <label>Eligibility Requirements</label>
                <input
                  type="text"
                  value={resourceForm.eligibility}
                  onChange={(e) => setResourceForm({...resourceForm, eligibility: e.target.value})}
                  placeholder="Income below 80% AMI, Must be Danville resident"
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingResource ? 'Update Resource' : 'Create Resource')}
                </button>
                <button type="button" className="btn-secondary" onClick={resetResourceForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="resources-admin-list">
        <div className="resources-admin-header">
          <div className="resource-count">
            {resources.length} resource{resources.length !== 1 ? 's' : ''} total
          </div>
          <div className="resource-filters">
            <select 
              onChange={(e) => {
                // Filter resources by category
                const category = e.target.value;
                if (category === 'all') {
                  fetchResources();
                } else {
                  const filtered = resources.filter(r => r.category === category);
                  setResources(filtered);
                }
              }}
              style={{
                padding: '0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: 'white'
              }}
            >
              <option value="all">All Categories</option>
              <option value="housing">Housing Help</option>
              <option value="utilities">Utilities</option>
              <option value="food">Food Banks</option>
              <option value="health">Healthcare</option>
              <option value="education">Education</option>
              <option value="employment">Employment</option>
              <option value="legal">Legal Services</option>
              <option value="transportation">Transportation</option>
            </select>
          </div>
        </div>
        
        {resources.map(resource => (
          <div key={resource.id} className="resource-admin-card">
            <div className="resource-admin-header">
              <div className="resource-admin-info">
                <h4>{resource.name}</h4>
                <span className="resource-category-badge">{resource.category}</span>
              </div>
              <div className="resource-admin-actions">
                <button 
                  className="action-btn" 
                  onClick={() => handleEditResource(resource)}
                  title="Edit resource"
                >
                  ✏️ Edit
                </button>
                <button 
                  className="action-btn danger" 
                  onClick={() => handleDeleteResource(resource.id)}
                  title="Delete resource"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
            
            <div className="resource-admin-content">
              <p className="resource-description">{resource.description}</p>
              
              <div className="resource-admin-details">
                {resource.phone && (
                  <div className="resource-detail-item">
                    <strong>📞 Phone:</strong> {resource.phone}
                  </div>
                )}
                {resource.address && (
                  <div className="resource-detail-item">
                    <strong>📍 Address:</strong> {resource.address}
                  </div>
                )}
                {resource.hours && (
                  <div className="resource-detail-item">
                    <strong>🕒 Hours:</strong> {resource.hours}
                  </div>
                )}
                {resource.eligibility && (
                  <div className="resource-detail-item">
                    <strong>✅ Eligibility:</strong> {resource.eligibility}
                  </div>
                )}
              </div>
              
              <div className="resource-admin-meta">
                <span>Created: {new Date(resource.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
        
        {resources.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
            <h4>No resources found</h4>
            <p>Start by adding your first community resource</p>
            <button 
              className="btn-primary" 
              onClick={() => setShowResourceForm(true)}
              style={{ marginTop: '1rem' }}
            >
              ➕ Add First Resource
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div>
      <div className="admin-header">
        <h3>Contact Messages</h3>
        <p>Manage and respond to resident inquiries</p>
      </div>
      
      <div className="messages-admin-list">
        {messages.map(message => (
          <div key={message.id} className="message-admin-card">
            <div className="message-admin-header">
              <div>
                <h4>{message.name}</h4>
                <p>{message.email || message.phone || 'No contact info'}</p>
              </div>
              <div className="message-admin-status">
                <select
                  value={message.status}
                  onChange={(e) => updateMessageStatus(message.id, e.target.value)}
                  className="status-select"
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
            <div className="message-admin-content">
              <p>{message.message}</p>
            </div>
            <div className="message-admin-meta">
              <span>Received: {new Date(message.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-nav">
        <div className="admin-nav-header">
          <h2>🛠️ Admin Dashboard</h2>
          <button className="btn-secondary" onClick={onLogout}>Logout</button>
        </div>
        
        <div className="admin-tabs">
          {adminTabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="admin-tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="admin-content">
        {error && <div className="error">{error}</div>}
        
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'applications' && renderApplications()}
        {activeTab === 'resources' && renderResources()}
        {activeTab === 'messages' && renderMessages()}
      </div>
    </div>
  );
};

export default AdminDashboard;