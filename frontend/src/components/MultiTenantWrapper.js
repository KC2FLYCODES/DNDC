import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { currentOrganization } from '../lib/supabase'

const TenantContext = createContext()

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

export const TenantProvider = ({ children }) => {
  const { organization, loading } = useSupabase()
  const [error, setError] = useState(null)
  const [tenantConfig, setTenantConfig] = useState({
    organizationId: null,
    organizationName: process.env.REACT_APP_DEFAULT_ORG_NAME || 'Community Resource Hub',
    slug: currentOrganization,
    logoUrl: process.env.REACT_APP_LOGO_URL || '/logo192.png',
    themeColors: {
      primary: 'var(--color-primary)',
      secondary: 'var(--color-primary-dark)'
    },
    featuresEnabled: {
      applications: true,
      documents: true,
      calculators: true,
      alerts: true,
      contact: true
    }
  })

  useEffect(() => {
    if (organization) {
      // Validate organization is active
      if (organization.is_active === false) {
        setError('This organization is currently inactive. Please contact support.')
        return
      }

      setTenantConfig(prev => ({
        ...prev,
        organizationId: organization.id,
        organizationName: organization.name,
        slug: organization.slug,
        logoUrl: organization.logo_url || prev.logoUrl,
        themeColors: organization.settings?.theme_colors || prev.themeColors,
        featuresEnabled: organization.settings?.features_enabled || prev.featuresEnabled
      }))

      // Apply theme colors to CSS variables
      if (organization.settings?.theme_colors) {
        document.documentElement.style.setProperty('--primary-color', organization.settings.theme_colors.primary)
        document.documentElement.style.setProperty('--secondary-color', organization.settings.theme_colors.secondary)
      }

      setError(null)
    } else if (!loading && currentOrganization) {
      // Organization slug provided but not found in database
      setError(`Organization "${currentOrganization}" not found. Please check the URL.`)
    }
  }, [organization, loading])

  if (loading) {
    return (
      <div className="tenant-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Resource Hub...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="tenant-error" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '2rem'
      }}>
        <div style={{
          background: '#fef2f2',
          border: '2px solid #fecaca',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Organization Error</h2>
          <p style={{ color: '#991b1b', marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: '#dc2626',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <TenantContext.Provider value={tenantConfig}>
      {children}
    </TenantContext.Provider>
  )
}

// HOC for wrapping components with tenant context
export const withTenant = (Component) => {
  return (props) => (
    <TenantProvider>
      <Component {...props} />
    </TenantProvider>
  )
}

// Tenant-aware component for conditional rendering
export const TenantFeature = ({ feature, children, fallback = null }) => {
  const { featuresEnabled } = useTenant()
  
  if (featuresEnabled[feature]) {
    return children
  }
  
  return fallback
}

// Tenant branding component
export const TenantBrand = ({ showName = true, showLogo = true, className = '' }) => {
  const { organizationName, logoUrl } = useTenant()
  
  return (
    <div className={`tenant-brand ${className}`}>
      {showLogo && logoUrl && (
        <img src={logoUrl} alt={`${organizationName} Logo`} className="tenant-logo" />
      )}
      {showName && (
        <span className="tenant-name">{organizationName}</span>
      )}
    </div>
  )
}