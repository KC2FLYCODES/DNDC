import React, { useState, useEffect } from 'react'
import { useSupabaseTable } from '../hooks/useSupabase'
import { supabase } from '../lib/supabase'

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('organizations')
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    slug: '',
    domain: '',
    contact_info: {}
  })

  const { 
    data: organizations, 
    loading: orgsLoading, 
    insert: insertOrg,
    update: updateOrg,
    remove: removeOrg 
  } = useSupabaseTable('organizations')

  const { 
    data: allUsers, 
    loading: usersLoading 
  } = useSupabaseTable('users')

  const { 
    data: allApplications, 
    loading: appsLoading 
  } = useSupabaseTable('applications')

  const createOrganization = async (e) => {
    e.preventDefault()
    
    const { data, error } = await insertOrg({
      ...newOrgForm,
      contact_info: newOrgForm.contact_info || {}
    })
    
    if (error) {
      alert(`Error creating organization: ${error}`)
    } else {
      setNewOrgForm({ name: '', slug: '', domain: '', contact_info: {} })
      alert('Organization created successfully!')
    }
  }

  const updateOrganizationStatus = async (orgId, isActive) => {
    const { error } = await updateOrg(orgId, { is_active: isActive })
    if (error) {
      alert(`Error updating organization: ${error}`)
    }
  }

  const renderOrganizations = () => (
    <div>
      <div className="admin-header">
        <h3>Organization Management</h3>
        <p>Manage all CDC organizations in the platform</p>
      </div>

      {/* Create New Organization Form */}
      <div className="create-org-form">
        <h4>Create New Organization</h4>
        <form onSubmit={createOrganization}>
          <div className="form-row">
            <div className="form-group">
              <label>Organization Name *</label>
              <input
                type="text"
                value={newOrgForm.name}
                onChange={(e) => setNewOrgForm({...newOrgForm, name: e.target.value})}
                placeholder="e.g., Atlanta Community Development Corporation"
                required
              />
            </div>
            <div className="form-group">
              <label>URL Slug *</label>
              <input
                type="text"
                value={newOrgForm.slug}
                onChange={(e) => setNewOrgForm({...newOrgForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                placeholder="e.g., atlanta-cdc"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Custom Domain (optional)</label>
            <input
              type="text"
              value={newOrgForm.domain}
              onChange={(e) => setNewOrgForm({...newOrgForm, domain: e.target.value})}
              placeholder="e.g., resources.atlantacdc.org"
            />
          </div>
          <button type="submit" className="btn-primary">Create Organization</button>
        </form>
      </div>

      {/* Organizations List */}
      <div className="organizations-list">
        <h4>Existing Organizations ({organizations.length})</h4>
        {orgsLoading ? (
          <div className="loading">Loading organizations...</div>
        ) : (
          <div className="org-cards">
            {organizations.map(org => (
              <div key={org.id} className="org-card">
                <div className="org-header">
                  <div>
                    <h5>{org.name}</h5>
                    <p className="org-slug">/{org.slug}</p>
                  </div>
                  <div className="org-status">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={org.is_active}
                        onChange={(e) => updateOrganizationStatus(org.id, e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
                <div className="org-details">
                  <div><strong>Created:</strong> {new Date(org.created_at).toLocaleDateString()}</div>
                  {org.domain && <div><strong>Domain:</strong> {org.domain}</div>}
                  <div><strong>Status:</strong> {org.is_active ? 'Active' : 'Inactive'}</div>
                </div>
                <div className="org-stats">
                  <div className="stat">
                    <span className="stat-number">{allUsers.filter(u => u.organization_id === org.id).length}</span>
                    <span className="stat-label">Users</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{allApplications.filter(a => a.organization_id === org.id).length}</span>
                    <span className="stat-label">Applications</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderPlatformStats = () => (
    <div>
      <div className="admin-header">
        <h3>Platform Statistics</h3>
        <p>Overall platform performance and usage</p>
      </div>

      <div className="platform-stats">
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <div className="stat-number">{organizations.length}</div>
            <div className="stat-label">Total Organizations</div>
            <div className="stat-sub">{organizations.filter(o => o.is_active).length} active</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{allUsers.length}</div>
            <div className="stat-label">Total Users</div>
            <div className="stat-sub">{allUsers.filter(u => u.is_active).length} active</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{allApplications.length}</div>
            <div className="stat-label">Total Applications</div>
            <div className="stat-sub">{allApplications.filter(a => a.status === 'approved').length} approved</div>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h4>Recent Activity</h4>
        <div className="activity-list">
          {organizations
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
            .map(org => (
              <div key={org.id} className="activity-item">
                <div className="activity-icon">🏢</div>
                <div className="activity-content">
                  <div className="activity-title">New organization: {org.name}</div>
                  <div className="activity-time">{new Date(org.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="super-admin-dashboard">
      <div className="admin-nav">
        <div className="admin-nav-header">
          <h2>🌟 Super Admin</h2>
          <p>Platform Management</p>
        </div>
        
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <span className="admin-tab-icon">📊</span>
            Platform Stats
          </button>
          <button
            className={`admin-tab ${activeTab === 'organizations' ? 'active' : ''}`}
            onClick={() => setActiveTab('organizations')}
          >
            <span className="admin-tab-icon">🏢</span>
            Organizations
          </button>
        </div>
      </div>
      
      <div className="admin-content">
        {activeTab === 'stats' && renderPlatformStats()}
        {activeTab === 'organizations' && renderOrganizations()}
      </div>
    </div>
  )
}

export default SuperAdminDashboard