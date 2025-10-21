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
  const [tenantConfig, setTenantConfig] = useState({
    organizationId: null,
    organizationName: 'DNDC Resource Hub',
    slug: currentOrganization,
    logoUrl: process.env.REACT_APP_LOGO_URL || 'https://customer-assets.emergentagent.com/job_e3758f2b-c14a-4943-82a6-1240008fd07b/artifacts/s5dpstmb_DNDC%20logo.jpg',
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
    }
  }, [organization])

  if (loading) {
    return (
      <div className="tenant-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading {currentOrganization.toUpperCase()} Resource Hub...</p>
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