import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApplicationTracker = ({ api }) => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewApplicationForm, setShowNewApplicationForm] = useState(false);
  const [newApplication, setNewApplication] = useState({
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    application_type: 'mission_180'
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/applications`);
      setApplications(response.data);
      if (response.data.length > 0 && !selectedApplication) {
        setSelectedApplication(response.data[0]);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const createApplication = async (e) => {
    e.preventDefault();
    
    if (!newApplication.applicant_name.trim()) {
      setError('Applicant name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${api}/applications`, newApplication);
      await fetchApplications();
      setSelectedApplication(response.data);
      setShowNewApplicationForm(false);
      setNewApplication({
        applicant_name: '',
        applicant_email: '',
        applicant_phone: '',
        application_type: 'mission_180'
      });
      setError(null);
    } catch (err) {
      setError('Failed to create application');
      console.error('Error creating application:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'submitted': '#f39c12',
      'under_review': 'var(--color-accent)',
      'approved': '#27ae60',
      'denied': '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'submitted': '📝',
      'under_review': '🔍',
      'approved': '✅',
      'denied': '❌'
    };
    return icons[status] || '📋';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDocumentStatus = (application) => {
    const required = application.required_documents || [];
    const completed = application.completed_documents || [];
    return {
      total: required.length,
      completed: completed.length,
      pending: required.filter(doc => !completed.includes(doc))
    };
  };

  if (loading && applications.length === 0) {
    return <div className="loading">Loading applications...</div>;
  }

  return (
    <div className="application-tracker">
      <div className="tracker-header">
        <h3>Mission 180 Application Tracker</h3>
        <button 
          className="btn-primary" 
          onClick={() => setShowNewApplicationForm(true)}
          style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          + New Application
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showNewApplicationForm && (
        <div className="application-form-modal">
          <div className="application-form-content">
            <h4>Create New Application</h4>
            <form onSubmit={createApplication}>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Applicant Name *"
                  value={newApplication.applicant_name}
                  onChange={(e) => setNewApplication({...newApplication, applicant_name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={newApplication.applicant_email}
                  onChange={(e) => setNewApplication({...newApplication, applicant_email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={newApplication.applicant_phone}
                  onChange={(e) => setNewApplication({...newApplication, applicant_phone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn-primary" disabled={loading}>
                  Create Application
                </button>
                <button 
                  type="button" 
                  className="action-btn secondary"
                  onClick={() => setShowNewApplicationForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {applications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          No applications found. Create your first application to get started.
        </div>
      ) : (
        <div className="tracker-content">
          <div className="application-selector">
            <label>Select Application:</label>
            <select 
              value={selectedApplication?.id || ''} 
              onChange={(e) => {
                const app = applications.find(a => a.id === e.target.value);
                setSelectedApplication(app);
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginTop: '0.5rem'
              }}
            >
              {applications.map(app => (
                <option key={app.id} value={app.id}>
                  {app.applicant_name} - {app.application_type} ({formatDate(app.created_at)})
                </option>
              ))}
            </select>
          </div>

          {selectedApplication && (
            <div className="application-details">
              <div className="application-card">
                <div className="application-header">
                  <h4>{selectedApplication.applicant_name}</h4>
                  <div className="status-badge" style={{ backgroundColor: getStatusColor(selectedApplication.status) }}>
                    {getStatusIcon(selectedApplication.status)} {selectedApplication.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                
                <div className="application-info">
                  <div className="info-item">
                    <strong>Application Type:</strong> Mission 180 Loan Program
                  </div>
                  <div className="info-item">
                    <strong>Submitted:</strong> {formatDate(selectedApplication.created_at)}
                  </div>
                  <div className="info-item">
                    <strong>Last Updated:</strong> {formatDate(selectedApplication.updated_at)}
                  </div>
                  {selectedApplication.notes && (
                    <div className="info-item">
                      <strong>Notes:</strong> {selectedApplication.notes}
                    </div>
                  )}
                </div>

                <div className="progress-section">
                  <div className="progress-header">
                    <h5>Application Progress</h5>
                    <span className="progress-percentage">{selectedApplication.progress_percentage}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${selectedApplication.progress_percentage}%`,
                        backgroundColor: getStatusColor(selectedApplication.status)
                      }}
                    ></div>
                  </div>
                  <div className="progress-stages">
                    <div className={`stage ${selectedApplication.progress_percentage >= 25 ? 'completed' : ''}`}>
                      📝 Submitted
                    </div>
                    <div className={`stage ${selectedApplication.progress_percentage >= 50 ? 'completed' : ''}`}>
                      🔍 Under Review
                    </div>
                    <div className={`stage ${selectedApplication.progress_percentage >= 100 ? 'completed' : ''}`}>
                      {selectedApplication.status === 'approved' ? '✅ Approved' : 
                       selectedApplication.status === 'denied' ? '❌ Denied' : '⏳ Decision'}
                    </div>
                  </div>
                </div>

                <div className="document-progress">
                  <h5>Document Checklist</h5>
                  {(() => {
                    const docStatus = getDocumentStatus(selectedApplication);
                    return (
                      <div>
                        <div className="document-summary">
                          {docStatus.completed} of {docStatus.total} documents completed
                        </div>
                        <div className="document-list">
                          {selectedApplication.required_documents?.map(doc => (
                            <div key={doc} className="document-item">
                              <span className={`doc-status ${selectedApplication.completed_documents?.includes(doc) ? 'completed' : 'pending'}`}>
                                {selectedApplication.completed_documents?.includes(doc) ? '✅' : '⏳'}
                              </span>
                              <span className="doc-name">{doc}</span>
                            </div>
                          ))}
                        </div>
                        {docStatus.pending.length > 0 && (
                          <div className="pending-docs">
                            <strong>Still needed:</strong> {docStatus.pending.join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApplicationTracker;