import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key'

// Validate environment variables in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.REACT_APP_SUPABASE_URL || supabaseUrl === 'https://your-project.supabase.co') {
    throw new Error('REACT_APP_SUPABASE_URL environment variable is not configured')
  }
  if (!process.env.REACT_APP_SUPABASE_ANON_KEY || supabaseAnonKey === 'your-anon-key') {
    throw new Error('REACT_APP_SUPABASE_ANON_KEY environment variable is not configured')
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Multi-tenant helper functions
export const getCurrentOrganization = () => {
  // Extract organization from subdomain or URL path
  const hostname = window.location.hostname
  const parts = hostname.split('.')

  if (parts.length > 2 && parts[0] !== 'www') {
    // Subdomain approach: org.yourdomain.com
    return parts[0]
  }

  // Path approach: yourdomain.com/org
  const pathParts = window.location.pathname.split('/')
  if (pathParts.length > 1 && pathParts[1]) {
    return pathParts[1]
  }

  // In production, require explicit organization selection
  if (process.env.NODE_ENV === 'production') {
    console.error('Unable to determine organization from URL')
    // In production, redirect to organization selection page or throw error
    return process.env.REACT_APP_DEFAULT_ORG_SLUG || null
  }

  // Default organization for development only
  return process.env.REACT_APP_DEFAULT_ORG_SLUG || 'demo'
}

export const setOrganizationContext = (organizationId) => {
  // Set organization context in Supabase client
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      // Add organization_id to the session JWT claims
      session.user.user_metadata = {
        ...session.user.user_metadata,
        organization_id: organizationId
      }
    }
  })
}

// Initialize organization context
const currentOrg = getCurrentOrganization()
setOrganizationContext(currentOrg)

export { currentOrg as currentOrganization }