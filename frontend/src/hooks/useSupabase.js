import { useState, useEffect } from 'react'
import { supabase, currentOrganization } from '../lib/supabase'

export const useSupabase = () => {
  const [user, setUser] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Get organization details
    fetchOrganization()

    return () => subscription.unsubscribe()
  }, [])

  const fetchOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', currentOrganization)
        .single()

      if (error) throw error
      setOrganization(data)
    } catch (error) {
      console.error('Error fetching organization:', error)
    }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          organization_id: organization?.id,
          ...userData
        }
      }
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    user,
    organization,
    loading,
    signIn,
    signUp,
    signOut,
    supabase
  }
}

export const useSupabaseTable = (tableName, organizationId = null) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const orgId = organizationId || currentOrganization

  useEffect(() => {
    fetchData()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel(`${tableName}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: tableName,
          filter: orgId ? `organization_id=eq.${orgId}` : undefined
        }, 
        (payload) => {
          console.log('Real-time change received:', payload)
          fetchData() // Refresh data on changes
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [tableName, orgId])

  const fetchData = async () => {
    try {
      setLoading(true)
      let query = supabase.from(tableName).select('*')
      
      if (orgId) {
        query = query.eq('organization_id', orgId)
      }
      
      const { data: result, error } = await query
      
      if (error) throw error
      setData(result || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const insert = async (record) => {
    try {
      const recordWithOrg = orgId ? { ...record, organization_id: orgId } : record
      const { data, error } = await supabase
        .from(tableName)
        .insert([recordWithOrg])
        .select()
      
      if (error) throw error
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }

  const update = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
      
      if (error) throw error
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }

  const remove = async (id) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { error: null }
    } catch (err) {
      return { error: err.message }
    }
  }

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    insert,
    update,
    remove
  }
}

export const useRealtimeSubscription = (table, callback, filter = null) => {
  useEffect(() => {
    const subscription = supabase
      .channel(`${table}_realtime`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table,
          filter
        }, 
        callback
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [table, callback, filter])
}