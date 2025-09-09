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
        <h3>Resource Management</h3>
        <p>Manage community resources and services</p>
      </div>
      
      <div className="resources-admin-grid">
        {resources.map(resource => (
          <div key={resource.id} className="resource-admin-card">
            <h4>{resource.name}</h4>
            <p>{resource.description}</p>
            <div className="resource-admin-meta">
              <span className="resource-category">{resource.category}</span>
              {resource.phone && (
                <span className="resource-phone">{resource.phone}</span>
              )}
            </div>
          </div>
        ))}
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