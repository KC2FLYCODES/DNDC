import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ResourcesTab from './ResourcesTab';
import DocumentsTab from './DocumentsTab';
import AlertsTab from './AlertsTab';
import ContactTab from './ContactTab';
import ApplicationTracker from './ApplicationTracker';
import FinancialCalculator from './FinancialCalculator';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import AnalyticsTracker from './AnalyticsTracker';
import useCapacitor from '../hooks/useCapacitor';
import ProgramsTab from './ProgramsTab';
import ProgramManagement from './ProgramManagement';
import NeighborhoodMap from './NeighborhoodMap';
import CommunityBoard from './CommunityBoard';
import NotificationCenter from './NotificationCenter';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ResourceHub = () => {
  const [activeTab, setActiveTab] = useState('resources');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
  const dropdownRef = useRef(null);
  const [analytics] = useState(new AnalyticsTracker(API));
  const { isNative, platform, scheduleNotification } = useCapacitor();

  const tabs = [
    { id: 'resources', label: 'Community Resources', icon: '🏘️' },
    { id: 'programs', label: 'Housing Programs', icon: '📋' },
    { id: 'map', label: 'Property Map', icon: '🗺️' },
    { id: 'community', label: 'Community Board', icon: '🌟' },
    { id: 'applications', label: 'My Application', icon: '📊' },
    { id: 'calculator', label: 'Financial Calculator', icon: '💰' },
    { id: 'documents', label: 'Document Upload', icon: '📄' },
    { id: 'alerts', label: 'Alerts & Updates', icon: '📢' },
    { id: 'contact', label: 'Contact DNDC', icon: '📞' }
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);

  useEffect(() => {
    // Track initial page view
    analytics.trackPageView('resources');
    
    // Show native app welcome message
    if (isNative) {
      console.log(`DNDC Resource Hub running on ${platform}`);
      
      // Schedule a welcome notification (optional)
      const welcomeDate = new Date(Date.now() + 5000); // 5 seconds from now
      scheduleNotification(
        'Welcome to DNDC Resource Hub!', 
        'Access housing assistance, financial tools, and community resources anytime.',
        welcomeDate
      );
    }
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [analytics, isNative, platform, scheduleNotification]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setDropdownOpen(false);
    
    // Track page view
    analytics.trackPageView(tabId);
    analytics.trackButtonClick(`nav_${tabId}`, 'navigation');
    
    // Haptic feedback on native devices
    if (isNative) {
      try {
        import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
          Haptics.impact({ style: ImpactStyle.Light });
        });
      } catch (error) {
        // Haptics not available
        console.log('Haptics not available');
      }
    }
  };

  const handleAdminLogin = (user, token) => {
    setAdminUser(user);
    setAdminToken(token);
    setShowAdminLogin(false);
    
    // Track admin login
    analytics.track('admin_login', 'admin', { username: user.username, role: user.role });
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    setAdminToken(null);
    
    // Track admin logout
    analytics.track('admin_logout', 'admin');
  };

  const renderTabContent = () => {
    const commonProps = { api: API, analytics, isNative, platform };
    
    switch (activeTab) {
      case 'resources':
        return <ResourcesTab {...commonProps} />;
      case 'programs':
        return <ProgramsTab {...commonProps} />;
      case 'map':
        return <NeighborhoodMap {...commonProps} />;
      case 'community':
        return <CommunityBoard {...commonProps} />;
      case 'applications':
        return <ApplicationTracker {...commonProps} />;
      case 'calculator':
        return <FinancialCalculator {...commonProps} />;
      case 'documents':
        return <DocumentsTab {...commonProps} />;
      case 'alerts':
        return <AlertsTab {...commonProps} />;
      case 'contact':
        return <ContactTab {...commonProps} />;
      default:
        return <ResourcesTab {...commonProps} />;
    }
  };

  // Show admin dashboard with program management
  if (adminUser) {
    return (
      <div>
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white', 
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0 }}>DNDC Admin Portal</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={() => setActiveAdminTab('dashboard')}
              style={{
                background: activeAdminTab === 'dashboard' ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveAdminTab('programs')}
              style={{
                background: activeAdminTab === 'programs' ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              📋 Programs
            </button>
            <button onClick={handleAdminLogout} style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}>
              Logout
            </button>
          </div>
        </div>
        {activeAdminTab === 'dashboard' ? (
          <AdminDashboard api={API} onLogout={handleAdminLogout} />
        ) : (
          <ProgramManagement api={API} />
        )}
      </div>
    );
  }

  // Show admin login modal
  if (showAdminLogin) {
    return <AdminLogin api={API} onLogin={handleAdminLogin} />;
  }

  return (
    <div className="resource-hub">
      <header className="resource-hub-header">
        <div className="header-content">
          <div className="logo-container">
            <img 
              src="https://customer-assets.emergentagent.com/job_e3758f2b-c14a-4943-82a6-1240008fd07b/artifacts/s5dpstmb_DNDC%20logo.jpg" 
              alt="DNDC Logo" 
              loading="eager"
            />
          </div>
          <div className="header-text">
            <h1 className="resource-hub-title">DNDC Resource Hub</h1>
            <div className="subtitle">Danville Neighborhood Development Corporation</div>
            <div className="powered-by">
              {isNative ? `Native App • ${platform}` : 'Community Development Technology Platform'}
            </div>
          </div>
          {!isNative && (
            <button 
              className="admin-access-btn"
              onClick={() => setShowAdminLogin(true)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
              🛠️ Admin
            </button>
          )}
        </div>
      </header>
      
      <nav className="nav-dropdown-container">
        <div className="nav-dropdown-wrapper">
          <div className="nav-dropdown" ref={dropdownRef}>
            <button
              className="nav-dropdown-button"
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                analytics.trackButtonClick('navigation_dropdown', 'navigation');
              }}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="nav-dropdown-item-icon">{currentTab?.icon}</span>
                {currentTab?.label}
              </span>
              <span className={`nav-dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>
                ▼
              </span>
            </button>
            
            {dropdownOpen && (
              <>
                <div className="nav-dropdown-overlay" onClick={() => setDropdownOpen(false)} />
                <div className={`nav-dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
                  {tabs.map(tab => (
                    <div
                      key={tab.id}
                      className={`nav-dropdown-item ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => handleTabChange(tab.id)}
                    >
                      <span className="nav-dropdown-item-icon">{tab.icon}</span>
                      {tab.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
      
      <div className="content">
        {error && <div className="error">{error}</div>}
        {renderTabContent()}
      </div>
      
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img 
              src="https://customer-assets.emergentagent.com/job_e3758f2b-c14a-4943-82a6-1240008fd07b/artifacts/s5dpstmb_DNDC%20logo.jpg" 
              alt="DNDC Logo" 
            />
          </div>
          <div className="footer-text">
            © 2025 Danville Neighborhood Development Corporation
          </div>
          <div className="footer-tagline">
            Empowering Communities • Building Futures • Creating Opportunities
          </div>
          {isNative && (
            <div style={{ fontSize: '0.75rem', opacity: '0.7', marginTop: '0.5rem' }}>
              📱 Native App Version {platform}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default ResourceHub;