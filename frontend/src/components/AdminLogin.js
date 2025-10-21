import React, { useState } from 'react';
import axios from 'axios';

const AdminLogin = ({ api, onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Username and password are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${api}/admin/login`, credentials);
      
      if (response.data.success) {
        onLogin(response.data.user, response.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-logo">
            <img 
              src={process.env.REACT_APP_LOGO_URL || "https://customer-assets.emergentagent.com/job_e3758f2b-c14a-4943-82a6-1240008fd07b/artifacts/s5dpstmb_DNDC%20logo.jpg"} 
              alt="DNDC Logo" 
            />
          </div>
          <h2>Admin Login</h2>
          <p>DNDC Resource Hub Administration</p>
        </div>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              placeholder="Enter your username"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="admin-login-help">
          <p><strong>Demo Credentials:</strong></p>
          <ul>
            <li><strong>dndc_admin</strong> / dndc2024 (Full Admin)</li>
            <li><strong>staff</strong> / staff123 (Staff)</li>
            <li><strong>admin</strong> / admin123 (General Admin)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;