import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Component for managing Alerts
export const AlertsManagement = ({ api }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    alert_type: 'info',
    deadline: '',
    is_active: true
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/admin/alerts`);
      setAlerts(response.data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAlert) {
        await axios.put(`${api}/admin/alerts/${editingAlert.id}`, formData);
      } else {
        await axios.post(`${api}/alerts`, formData);
      }
      fetchAlerts();
      resetForm();
    } catch (err) {
      console.error('Error saving alert:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this alert?')) return;
    try {
      await axios.delete(`${api}/admin/alerts/${id}`);
      fetchAlerts();
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  const handleEdit = (alert) => {
    setEditingAlert(alert);
    setFormData({
      title: alert.title,
      message: alert.message,
      alert_type: alert.alert_type,
      deadline: alert.deadline || '',
      is_active: alert.is_active
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingAlert(null);
    setShowForm(false);
    setFormData({
      title: '',
      message: '',
      alert_type: 'info',
      deadline: '',
      is_active: true
    });
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <h3>🚨 Alerts Management</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ New Alert'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="management-form">
          <input
            type="text"
            placeholder="Alert Title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
          <textarea
            placeholder="Alert Message"
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            required
          />
          <select
            value={formData.alert_type}
            onChange={(e) => setFormData({...formData, alert_type: e.target.value})}
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="urgent">Urgent</option>
          </select>
          <input
            type="datetime-local"
            placeholder="Deadline (optional)"
            value={formData.deadline}
            onChange={(e) => setFormData({...formData, deadline: e.target.value})}
          />
          <label>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
            />
            Active
          </label>
          <button type="submit" className="btn-primary">
            {editingAlert ? 'Update Alert' : 'Create Alert'}
          </button>
        </form>
      )}

      <div className="items-list">
        {alerts.map((alert) => (
          <div key={alert.id} className="item-card">
            <div className="item-header">
              <h4>{alert.title}</h4>
              <span className={`badge badge-${alert.alert_type}`}>{alert.alert_type}</span>
            </div>
            <p>{alert.message}</p>
            <div className="item-actions">
              <button onClick={() => handleEdit(alert)} className="btn-edit">Edit</button>
              <button onClick={() => handleDelete(alert.id)} className="btn-delete">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component for managing Properties
export const PropertiesManagement = ({ api }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/admin/properties`);
      setProperties(response.data);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`${api}/admin/properties/${id}/status`, null, { params: { status } });
      fetchProperties();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this property?')) return;
    try {
      await axios.delete(`${api}/admin/properties/${id}`);
      fetchProperties();
    } catch (err) {
      console.error('Error deleting property:', err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#fbbf24',
      approved: '#34d399',
      available: '#60a5fa',
      rented: '#a78bfa',
      sold: '#f87171'
    };
    return colors[status] || '#gray';
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <h3>🏘️ Property Management</h3>
        <p className="subtitle">Approve and manage property listings</p>
      </div>

      <div className="items-list">
        {properties.map((property) => (
          <div key={property.id} className="item-card">
            <div className="item-header">
              <h4>{property.title}</h4>
              <select
                value={property.status}
                onChange={(e) => handleStatusChange(property.id, e.target.value)}
                style={{ backgroundColor: getStatusColor(property.status), color: 'white', padding: '4px 8px', borderRadius: '4px' }}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            <p>{property.address}, {property.city}</p>
            <div className="property-details">
              <span>🛏️ {property.bedrooms} bed | 🛁 {property.bathrooms} bath</span>
              <span>{property.property_type}</span>
              {property.price && <span>💰 ${property.price.toLocaleString()}</span>}
              {property.rent && <span>💵 ${property.rent}/mo</span>}
            </div>
            <div className="item-actions">
              <button onClick={() => handleDelete(property.id)} className="btn-delete">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component for managing Success Stories
export const StoriesManagement = ({ api }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/admin/success-stories`);
      setStories(response.data);
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`${api}/admin/success-stories/${id}/approve`);
      fetchStories();
    } catch (err) {
      console.error('Error approving story:', err);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`${api}/admin/success-stories/${id}/reject`);
      fetchStories();
    } catch (err) {
      console.error('Error rejecting story:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this story?')) return;
    try {
      await axios.delete(`${api}/success-stories/${id}`);
      fetchStories();
    } catch (err) {
      console.error('Error deleting story:', err);
    }
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <h3>⭐ Success Stories Management</h3>
        <p className="subtitle">Approve and manage community success stories</p>
      </div>

      <div className="items-list">
        {stories.map((story) => (
          <div key={story.id} className="item-card">
            <div className="item-header">
              <h4>{story.title}</h4>
              <div>
                {story.is_approved ? (
                  <span className="badge badge-success">✓ Approved</span>
                ) : (
                  <span className="badge badge-warning">⏳ Pending</span>
                )}
                {story.is_featured && <span className="badge badge-featured">⭐ Featured</span>}
              </div>
            </div>
            <p><strong>By:</strong> {story.resident_name}</p>
            <p className="story-text">{story.story_text.substring(0, 200)}...</p>
            {story.program_name && <p><strong>Program:</strong> {story.program_name}</p>}
            <div className="item-actions">
              {!story.is_approved && (
                <button onClick={() => handleApprove(story.id)} className="btn-success">Approve</button>
              )}
              {story.is_approved && (
                <button onClick={() => handleReject(story.id)} className="btn-warning">Reject</button>
              )}
              <button onClick={() => handleDelete(story.id)} className="btn-delete">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component for managing Events
export const EventsManagement = ({ api }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/admin/events`);
      setEvents(response.data);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await axios.delete(`${api}/admin/events/${id}`);
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <h3>📅 Events Management</h3>
      </div>

      <div className="items-list">
        {events.map((event) => (
          <div key={event.id} className="item-card">
            <div className="item-header">
              <h4>{event.title}</h4>
              <span className="badge">{event.event_type}</span>
            </div>
            <p>{event.description}</p>
            <p><strong>📅 Date:</strong> {new Date(event.event_date).toLocaleDateString()}</p>
            <p><strong>📍 Location:</strong> {event.location}</p>
            {event.max_attendees && (
              <p><strong>Attendees:</strong> {event.current_attendees}/{event.max_attendees}</p>
            )}
            <div className="item-actions">
              <button onClick={() => handleDelete(event.id)} className="btn-delete">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component for managing Testimonials
export const TestimonialsManagement = ({ api }) => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/admin/testimonials`);
      setTestimonials(response.data);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`${api}/admin/testimonials/${id}/approve`);
      fetchTestimonials();
    } catch (err) {
      console.error('Error approving testimonial:', err);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`${api}/admin/testimonials/${id}/reject`);
      fetchTestimonials();
    } catch (err) {
      console.error('Error rejecting testimonial:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await axios.delete(`${api}/admin/testimonials/${id}`);
      fetchTestimonials();
    } catch (err) {
      console.error('Error deleting testimonial:', err);
    }
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <h3>💬 Testimonials Management</h3>
        <p className="subtitle">Approve and manage resident testimonials</p>
      </div>

      <div className="items-list">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="item-card">
            <div className="item-header">
              <h4>{testimonial.resident_name}</h4>
              <div>
                {testimonial.is_approved ? (
                  <span className="badge badge-success">✓ Approved</span>
                ) : (
                  <span className="badge badge-warning">⏳ Pending</span>
                )}
                <span className="badge">⭐ {testimonial.rating}/5</span>
              </div>
            </div>
            <p>{testimonial.testimonial_text}</p>
            {testimonial.program_name && <p><strong>Program:</strong> {testimonial.program_name}</p>}
            <div className="item-actions">
              {!testimonial.is_approved && (
                <button onClick={() => handleApprove(testimonial.id)} className="btn-success">Approve</button>
              )}
              {testimonial.is_approved && (
                <button onClick={() => handleReject(testimonial.id)} className="btn-warning">Reject</button>
              )}
              <button onClick={() => handleDelete(testimonial.id)} className="btn-delete">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component for managing Notifications
export const NotificationsManagement = ({ api }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/admin/notifications`);
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await axios.delete(`${api}/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <h3>🔔 Notifications Management</h3>
      </div>

      <div className="items-list">
        {notifications.map((notif) => (
          <div key={notif.id} className="item-card">
            <div className="item-header">
              <h4>{notif.title}</h4>
              <span className={`badge badge-${notif.priority}`}>{notif.priority}</span>
            </div>
            <p>{notif.message}</p>
            <p><strong>Type:</strong> {notif.notification_type}</p>
            {notif.user_id ? <p>👤 User-specific</p> : <p>📢 Broadcast</p>}
            <div className="item-actions">
              <button onClick={() => handleDelete(notif.id)} className="btn-delete">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component for managing Admin Users
export const UsersManagement = ({ api }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'admin'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/admin/users`);
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`${api}/admin/users/${editingUser.id}`, formData);
      } else {
        await axios.post(`${api}/admin/users`, formData);
      }
      fetchUsers();
      resetForm();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axios.delete(`${api}/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      role: user.role || 'admin'
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setShowForm(false);
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      role: 'admin'
    });
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <h3>👥 Admin Users Management</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ New Admin'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="management-form">
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder={editingUser ? "Password (leave blank to keep current)" : "Password"}
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required={!editingUser}
          />
          <input
            type="text"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
          />
          <select
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
          >
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <button type="submit" className="btn-primary">
            {editingUser ? 'Update User' : 'Create User'}
          </button>
        </form>
      )}

      <div className="items-list">
        {users.map((user) => (
          <div key={user.id} className="item-card">
            <div className="item-header">
              <h4>{user.username}</h4>
              <span className="badge">{user.role}</span>
            </div>
            <p>📧 {user.email}</p>
            {user.full_name && <p>👤 {user.full_name}</p>}
            <div className="item-actions">
              <button onClick={() => handleEdit(user)} className="btn-edit">Edit</button>
              <button onClick={() => handleDelete(user.id)} className="btn-delete">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
