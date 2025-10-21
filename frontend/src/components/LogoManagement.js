import React, { useState, useEffect } from 'react';

const LogoManagement = ({ api }) => {
  const [currentLogo, setCurrentLogo] = useState(process.env.REACT_APP_LOGO_URL || '');
  const [customUrl, setCustomUrl] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('current');
  const [uploading, setUploading] = useState(false);

  // Preset logo options
  const logoPresets = [
    {
      id: 'dndc-current',
      name: 'DNDC Current Logo',
      url: 'https://customer-assets.emergentagent.com/job_e3758f2b-c14a-4943-82a6-1240008fd07b/artifacts/s5dpstmb_DNDC%20logo.jpg',
      description: 'Official DNDC logo'
    },
    {
      id: 'placeholder-1',
      name: 'Placeholder Logo 1',
      url: 'https://via.placeholder.com/200x80/5CB85C/FFFFFF?text=Your+Logo',
      description: 'Green themed placeholder'
    },
    {
      id: 'placeholder-2',
      name: 'Placeholder Logo 2',
      url: 'https://via.placeholder.com/200x80/007bff/FFFFFF?text=Your+Org',
      description: 'Blue themed placeholder'
    }
  ];

  useEffect(() => {
    fetchCurrentLogo();
  }, []);

  const fetchCurrentLogo = () => {
    // Get current logo from environment or localStorage
    const savedLogo = localStorage.getItem('org_logo_url') || process.env.REACT_APP_LOGO_URL;
    setCurrentLogo(savedLogo);
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.id);
    setCurrentLogo(preset.url);
  };

  const handleCustomUrl = () => {
    if (customUrl.trim()) {
      setCurrentLogo(customUrl);
      setSelectedPreset('custom');
    }
  };

  const handleSaveLogo = () => {
    // Save to localStorage (in production, this would save to database)
    localStorage.setItem('org_logo_url', currentLogo);
    alert('Logo updated successfully! Refresh the page to see changes.');
    window.location.reload();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setUploading(true);

    try {
      // Create a local URL for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentLogo(reader.result);
        setSelectedPreset('uploaded');
        setUploading(false);
      };
      reader.readAsDataURL(file);

      // In production, you would upload to a server or cloud storage
      // For now, we'll use the base64 data URL
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo');
      setUploading(false);
    }
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h3>🎨 Logo & Branding Management</h3>
          <p className="subtitle">Customize your organization's logo and branding</p>
        </div>
        <button onClick={handleSaveLogo} className="btn-primary">
          💾 Save Changes
        </button>
      </div>

      {/* Current Logo Preview */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
          Current Logo Preview
        </h4>
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
          padding: '3rem',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px'
        }}>
          {currentLogo ? (
            <img 
              src={currentLogo} 
              alt="Organization Logo"
              style={{
                maxHeight: '120px',
                maxWidth: '100%',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)'
              }}
            />
          ) : (
            <div style={{ color: 'white', fontSize: '1rem' }}>
              No logo selected
            </div>
          )}
        </div>
      </div>

      {/* Logo Selection Methods */}
      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Method 1: Preset Selection */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
            📚 Choose from Presets
          </h4>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {logoPresets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                style={{
                  padding: '1rem',
                  border: selectedPreset === preset.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)',
                  background: selectedPreset === preset.id ? '#F0F9F0' : 'white'
                }}
              >
                <div style={{
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem',
                  background: '#f8f9fa',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <img 
                    src={preset.url} 
                    alt={preset.name}
                    style={{
                      maxHeight: '60px',
                      maxWidth: '90%',
                      objectFit: 'contain'
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  {preset.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {preset.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Method 2: Upload Custom Logo */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
            📤 Upload Custom Logo
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Upload your organization's logo (PNG, JPG, or SVG, max 2MB)
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="logo-upload"
            />
            <label htmlFor="logo-upload">
              <button 
                className="btn-primary"
                disabled={uploading}
                onClick={() => document.getElementById('logo-upload').click()}
                type="button"
              >
                {uploading ? '⏳ Uploading...' : '📤 Choose File'}
              </button>
            </label>
            {selectedPreset === 'uploaded' && (
              <span style={{ fontSize: '0.875rem', color: 'var(--color-success)' }}>
                ✓ Logo uploaded successfully
              </span>
            )}
          </div>
        </div>

        {/* Method 3: Custom URL */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
            🔗 Use Custom URL
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Enter a direct URL to your logo hosted elsewhere
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              style={{ flex: 1 }}
            />
            <button onClick={handleCustomUrl} className="btn-primary">
              Apply URL
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          padding: '1.5rem',
          background: '#E8F5E9',
          border: '1px solid var(--color-primary)',
          borderRadius: 'var(--radius-md)'
        }}>
          <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600', color: 'var(--color-primary-dark)' }}>
            💡 Logo Guidelines
          </h4>
          <ul style={{ fontSize: '0.875rem', color: '#333', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
            <li>Recommended size: 200x80 pixels (width x height)</li>
            <li>Use transparent PNG for best results</li>
            <li>Logo will appear white on colored backgrounds</li>
            <li>Ensure logo is high quality and professional</li>
            <li>Click "Save Changes" to apply your new logo</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LogoManagement;
