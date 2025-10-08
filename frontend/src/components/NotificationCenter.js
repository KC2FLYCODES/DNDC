import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NotificationCenter = ({ api, analytics, isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/notifications`, {
        params: { unread_only: filter === 'unread' }
      });
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${api}/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      analytics.trackButtonClick(`mark_notification_read_${notificationId}`, 'notifications');
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${api}/notifications/mark-all-read?user_id=guest`);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      analytics.trackButtonClick('mark_all_notifications_read', 'notifications');
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'normal': return '#3b82f6';
      case 'low': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'deadline_reminder': return '⏰';
      case 'property_alert': return '🏠';
      case 'program_update': return '📋';
      case 'general': return '📢';
      default: return '🔔';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '100%',
        maxWidth: '450px',
        height: '100vh',
        background: 'white',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.2)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '2px solid #e2e8f0',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>🔔 Notifications</h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
        
        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => {
              setFilter('all');
              fetchNotifications();
            }}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: filter === 'all' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            All
          </button>
          <button
            onClick={() => {
              setFilter('unread');
              fetchNotifications();
            }}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: filter === 'unread' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '0.9rem', color: '#718096' }}>
          {notifications.filter(n => !n.is_read).length} unread
        </span>
        <button
          onClick={markAllAsRead}
          style={{
            background: 'transparent',
            border: '1px solid #667eea',
            color: '#667eea',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Mark all as read
        </button>
      </div>

      {/* Notification List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
            <p>No notifications yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
                style={{
                  padding: '1rem',
                  background: notification.is_read ? '#f7fafc' : 'white',
                  border: `2px solid ${notification.is_read ? '#e2e8f0' : getPriorityColor(notification.priority)}`,
                  borderRadius: '10px',
                  cursor: notification.is_read ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  if (!notification.is_read) {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {!notification.is_read && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '10px',
                    height: '10px',
                    background: getPriorityColor(notification.priority),
                    borderRadius: '50%'
                  }}></div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                  <div style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: notification.is_read ? '500' : '700',
                      marginBottom: '0.5rem',
                      color: notification.is_read ? '#4a5568' : '#1a202c'
                    }}>
                      {notification.title}
                    </h4>
                    <p style={{
                      fontSize: '0.9rem',
                      color: notification.is_read ? '#718096' : '#4a5568',
                      lineHeight: '1.5',
                      marginBottom: '0.5rem'
                    }}>
                      {notification.message}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#a0aec0',
                        fontWeight: '500'
                      }}>
                        {formatDate(notification.created_at)}
                      </span>
                      {notification.action_url && (
                        <button
                          style={{
                            background: getPriorityColor(notification.priority),
                            color: 'white',
                            border: 'none',
                            padding: '0.3rem 0.7rem',
                            borderRadius: '5px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;