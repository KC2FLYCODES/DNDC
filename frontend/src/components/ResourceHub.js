import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ResourcesTab from './ResourcesTab';
import DocumentsTab from './DocumentsTab';
import AlertsTab from './AlertsTab';
import ContactTab from './ContactTab';
import ApplicationTracker from './ApplicationTracker';
import FinancialCalculator from './FinancialCalculator';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ResourceHub = () => {
  const [activeTab, setActiveTab] = useState('resources');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  const tabs = [
    { id: 'resources', label: 'Community Resources', icon: '🏘️' },
    { id: 'applications', label: 'My Application', icon: '📋' },
    { id: 'calculator', label: 'Financial Calculator', icon: '💰' },
    { id: 'documents', label: 'Document Upload', icon: '📄' },
    { id: 'alerts', label: 'Alerts & Updates', icon: '📢' },
    { id: 'contact', label: 'Contact DNDC', icon: '📞' }
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setDropdownOpen(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'resources':
        return <ResourcesTab api={API} />;
      case 'applications':
        return <ApplicationTracker api={API} />;
      case 'calculator':
        return <FinancialCalculator api={API} />;
      case 'documents':
        return <DocumentsTab api={API} />;
      case 'alerts':
        return <AlertsTab api={API} />;
      case 'contact':
        return <ContactTab api={API} />;
      default:
        return <ResourcesTab api={API} />;
    }
  };

  return (
    <div className="resource-hub">
      <header className="resource-hub-header">
        <div className="header-content">
          <div className="logo-container">
            <img 
              src="https://customer-assets.emergentagent.com/job_e3758f2b-c14a-4943-82a6-1240008fd07b/artifacts/s5dpstmb_DNDC%20logo.jpg" 
              alt="DNDC Logo" 
            />
          </div>
          <div className="header-text">
            <h1 className="resource-hub-title">DNDC Resource Hub</h1>
            <div className="subtitle">Danville Neighborhood Development Corporation</div>
            <div className="powered-by">Powered by Community Development Technology Platform</div>
          </div>
        </div>
      </header>
      
      <nav className="nav-dropdown-container">
        <div className="nav-dropdown-wrapper">
          <div className="nav-dropdown" ref={dropdownRef}>
            <button
              className="nav-dropdown-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
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
        </div>
      </footer>
    </div>
  );
};

export default ResourceHub;