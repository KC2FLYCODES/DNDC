import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AlertsTab = ({ api }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/alerts`);
      setAlerts(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load alerts');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Posted: 1 day ago';
    } else if (diffDays < 7) {
      return `Posted: ${diffDays} days ago`;
    } else if (diffDays < 14) {
      return 'Posted: 1 week ago';
    } else if (diffDays < 21) {
      return 'Posted: 2 weeks ago';
    } else {
      return `Posted: ${Math.floor(diffDays / 7)} weeks ago`;
    }
  };

  if (loading) {
    return <div className="loading">Loading alerts...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Community Alerts & Updates</h3>
            <p className="card-subtitle">Stay informed about new opportunities and important deadlines</p>
          </div>
        </div>
        
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📢</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              No alerts at this time
            </div>
            <div>Check back regularly for new opportunities and updates</div>
          </div>
        ) : (
          <div style={{ marginBottom: '1rem', color: 'var(--color-text-primary)', fontWeight: '500' }}>
            {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      
      {alerts.map(alert => (
        <div key={alert.id} className="alert-card">
          <div className="alert-title">{alert.title}</div>
          <div className="alert-message">{alert.message}</div>
          <div className="alert-date">
            {formatDate(alert.posted_date)}
            {alert.deadline && (
              <span> • <strong>Deadline:</strong> {new Date(alert.deadline).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertsTab;