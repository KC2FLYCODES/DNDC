import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EnterpriseApplicationTracker = ({ api }) => {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/applications`);
      setApplications(response.data);
      if (response.data.length > 0 && !selectedApp) {
        setSelectedApp(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
      'in-review': { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
      approved: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
      rejected: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' }
    };
    return colors[status] || colors.pending;
  };

  const getProgressPercentage = (app) => {
    if (!app) return 0;
    const total = app.required_documents?.length || 0;
    const completed = app.completed_documents?.length || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getStepStatus = (app, step) => {
    const statusMap = {
      pending: 0,
      'in-review': 1,
      approved: 2,
      rejected: 2
    };
    const currentStep = statusMap[app?.status] || 0;
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch = app.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.application_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="loading">Loading applications...</div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--color-background)', minHeight: '100vh' }}>
      {/* Enterprise Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid var(--color-border)',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700',
              color: 'var(--color-primary)',
              margin: 0
            }}>
              📊 Application Management
            </h1>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                style={{
                  padding: '0.5rem 1rem',
                  background: showAnalytics ? 'var(--color-primary)' : 'white',
                  color: showAnalytics ? 'white' : 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)'
                }}
              >
                📈 Analytics
              </button>
            </div>
          </div>
          <button 
            className="btn-primary"
            onClick={() => window.location.href = '#new-application'}
          >
            + New Application
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Analytics Dashboard */}
        {showAnalytics && (
          <div style={{ 
            marginBottom: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem'
          }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                Total Applications
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                {applications.length}
              </div>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                In Review
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3B82F6' }}>
                {applications.filter(a => a.status === 'in-review').length}
              </div>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                Approved
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10B981' }}>
                {applications.filter(a => a.status === 'approved').length}
              </div>
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                Avg. Completion
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                {Math.round(applications.reduce((acc, app) => acc + getProgressPercentage(app), 0) / applications.length)}%
              </div>
            </div>
          </div>
        )}

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '350px 1fr',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Left Sidebar - Application List */}
          <div>
            {/* Search and Filter */}
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="🔍 Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem',
              marginBottom: '1rem',
              flexWrap: 'wrap'
            }}>
              {['all', 'pending', 'in-review', 'approved', 'rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    background: filterStatus === status ? 'var(--color-primary)' : 'white',
                    color: filterStatus === status ? 'white' : 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    transition: 'all var(--transition-base)'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Application Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredApplications.map(app => {
                const statusColor = getStatusColor(app.status);
                const isSelected = selectedApp?.id === app.id;
                const progress = getProgressPercentage(app);

                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="card"
                    style={{
                      padding: '1rem',
                      cursor: 'pointer',
                      border: isSelected ? `2px solid var(--color-primary)` : '1px solid var(--color-border)',
                      transition: 'all var(--transition-base)',
                      background: isSelected ? '#F0F9F0' : 'white'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.75rem'
                    }}>
                      <div>
                        <div style={{ 
                          fontWeight: '600',
                          color: 'var(--color-text-primary)',
                          marginBottom: '0.25rem'
                        }}>
                          {app.applicant_name}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem',
                          color: 'var(--color-text-secondary)'
                        }}>
                          {app.application_type}
                        </div>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: statusColor.bg,
                        color: statusColor.text,
                        border: `1px solid ${statusColor.border}`,
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.625rem',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {app.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        marginBottom: '0.25rem'
                      }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Documents</span>
                        <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
                          {progress}%
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '4px',
                        background: 'var(--color-border-light)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: progress === 100 ? '#10B981' : 'var(--color-primary)',
                          transition: 'width var(--transition-base)'
                        }} />
                      </div>
                    </div>

                    <div style={{ 
                      fontSize: '0.75rem',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {new Date(app.created_at).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Application Details */}
          {selectedApp && (
            <div>
              {/* Application Header */}
              <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1.5rem'
                }}>
                  <div>
                    <h2 style={{ 
                      fontSize: '1.75rem',
                      fontWeight: '700',
                      color: 'var(--color-text-primary)',
                      marginBottom: '0.5rem'
                    }}>
                      {selectedApp.applicant_name}
                    </h2>
                    <div style={{ 
                      fontSize: '1rem',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '1rem'
                    }}>
                      {selectedApp.application_type}
                    </div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: getStatusColor(selectedApp.status).bg,
                      color: getStatusColor(selectedApp.status).text,
                      border: `1px solid ${getStatusColor(selectedApp.status).border}`,
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      {selectedApp.status === 'approved' && '✓ '}
                      {selectedApp.status === 'in-review' && '🔄 '}
                      {selectedApp.status === 'pending' && '⏳ '}
                      {selectedApp.status.toUpperCase().replace('-', ' ')}
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div style={{ 
                    display: 'flex',
                    gap: '2rem',
                    textAlign: 'right'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '0.25rem'
                      }}>
                        Submitted
                      </div>
                      <div style={{ 
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: 'var(--color-text-primary)'
                      }}>
                        {new Date(selectedApp.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '0.25rem'
                      }}>
                        Progress
                      </div>
                      <div style={{ 
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: 'var(--color-primary)'
                      }}>
                        {getProgressPercentage(selectedApp)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Process Stepper */}
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                  marginTop: '2rem'
                }}>
                  {/* Progress Line */}
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    right: '20px',
                    height: '3px',
                    background: 'var(--color-border-light)',
                    zIndex: 0
                  }}>
                    <div style={{
                      height: '100%',
                      width: getStepStatus(selectedApp, 2) === 'completed' ? '100%' : 
                             getStepStatus(selectedApp, 1) === 'completed' ? '50%' : '0%',
                      background: 'var(--color-primary)',
                      transition: 'width var(--transition-base)'
                    }} />
                  </div>

                  {[
                    { label: 'Submitted', icon: '📝' },
                    { label: 'Under Review', icon: '🔍' },
                    { label: 'Decision', icon: selectedApp.status === 'approved' ? '✅' : '📋' }
                  ].map((step, index) => {
                    const status = getStepStatus(selectedApp, index);
                    return (
                      <div key={index} style={{ 
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: status === 'completed' ? 'var(--color-primary)' :
                                    status === 'current' ? 'white' : 'var(--color-border-light)',
                          border: status === 'current' ? '3px solid var(--color-primary)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem',
                          marginBottom: '0.5rem',
                          transition: 'all var(--transition-base)'
                        }}>
                          {status === 'completed' ? '✓' : step.icon}
                        </div>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: status === 'current' ? '600' : '500',
                          color: status === 'upcoming' ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                          textAlign: 'center'
                        }}>
                          {step.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Document Checklist */}
              <div className="card" style={{ padding: '2rem' }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{ 
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: 'var(--color-text-primary)',
                    margin: 0
                  }}>
                    📄 Required Documents
                  </h3>
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: getProgressPercentage(selectedApp) === 100 ? '#D1FAE5' : '#FEF3C7',
                    color: getProgressPercentage(selectedApp) === 100 ? '#065F46' : '#92400E',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    {selectedApp.completed_documents?.length || 0} of {selectedApp.required_documents?.length || 0} Complete
                  </div>
                </div>

                {/* Document Grid */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1rem'
                }}>
                  {selectedApp.required_documents?.map((doc, index) => {
                    const isCompleted = selectedApp.completed_documents?.includes(doc);
                    return (
                      <div
                        key={index}
                        style={{
                          padding: '1.25rem',
                          background: isCompleted ? '#F0FDF4' : 'white',
                          border: `2px solid ${isCompleted ? '#10B981' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-lg)',
                          transition: 'all var(--transition-base)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          marginBottom: '1rem'
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-md)',
                            background: isCompleted ? '#10B981' : '#F59E0B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            flexShrink: 0
                          }}>
                            {isCompleted ? '✓' : '📄'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '600',
                              color: 'var(--color-text-primary)',
                              marginBottom: '0.25rem',
                              fontSize: '0.9rem'
                            }}>
                              {doc}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: isCompleted ? '#059669' : '#D97706',
                              fontWeight: '600'
                            }}>
                              {isCompleted ? 'Uploaded' : 'Pending'}
                            </div>
                          </div>
                        </div>
                        
                        {!isCompleted && (
                          <button
                            className="btn-primary"
                            style={{ 
                              width: '100%',
                              fontSize: '0.875rem',
                              padding: '0.5rem'
                            }}
                          >
                            📤 Upload
                          </button>
                        )}
                        
                        {isCompleted && (
                          <button
                            className="action-btn"
                            style={{ 
                              width: '100%',
                              fontSize: '0.875rem',
                              padding: '0.5rem'
                            }}
                          >
                            👁️ View Document
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activity Feed */}
              <div className="card" style={{ padding: '2rem', marginTop: '1.5rem' }}>
                <h3 style={{ 
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: 'var(--color-text-primary)',
                  marginBottom: '1.5rem'
                }}>
                  📋 Activity Timeline
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ 
                    display: 'flex',
                    gap: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--color-border-light)'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      flexShrink: 0
                    }}>
                      📝
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                        Application Submitted
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(selectedApp.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {selectedApp.status !== 'pending' && (
                    <div style={{ 
                      display: 'flex',
                      gap: '1rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid var(--color-border-light)'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#3B82F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        flexShrink: 0
                      }}>
                        🔍
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          Review Started
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                          Application moved to under review
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnterpriseApplicationTracker;
