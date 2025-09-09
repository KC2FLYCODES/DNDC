import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'resources', label: 'Resources' },
    { id: 'applications', label: 'My Application' },
    { id: 'calculator', label: 'Calculator' },
    { id: 'documents', label: 'Documents' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'contact', label: 'Contact' }
  ];

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
      
      <nav className="nav-tabs">
        <div className="nav-tabs-container">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
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