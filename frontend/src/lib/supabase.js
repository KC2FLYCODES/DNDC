import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Multi-tenant helper functions
export const getCurrentOrganization = () => {
  // Extract organization from subdomain or URL path
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  
  if (parts.length > 2 && parts[0] !== 'www') {
    // Subdomain approach: dndc.yourdomain.com
    return parts[0]
  }
  
  // Path approach: yourdomain.com/dndc
  const pathParts = window.location.pathname.split('/')
  if (pathParts.length > 1 && pathParts[1]) {
    return pathParts[1]
  }
  
  // Default organization for development
  return 'dndc'
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