import React, { useState } from 'react';
import axios from 'axios';

const OrganizationSignup = ({ api, onSignupComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Step 1: Organization Info
    organizationName: '',
    organizationType: 'cdc',
    slug: '',
    
    // Step 2: Contact Info
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Step 3: Admin Account
    adminUsername: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    
    // Step 4: Plan Selection
    planTier: 'professional',
    billingCycle: 'monthly',
    
    // Step 5: Customization
    logoUrl: '',
    primaryColor: '#5CB85C',
    secondaryColor: '#007bff'
  });

  const orgTypes = [
    { value: 'cdc', label: 'Community Development Corporation' },
    { value: 'housing-authority', label: 'Housing Authority' },
    { value: 'nonprofit', label: 'Nonprofit Housing Organization' },
    { value: 'government', label: 'Government Agency' },
    { value: 'other', label: 'Other' }
  ];

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 299,
      features: ['Up to 3 admin users', '100 applications/month', 'Basic analytics', '5GB storage', 'Email support']
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 599,
      features: ['Up to 10 admin users', '500 applications/month', 'Advanced analytics', '25GB storage', 'Priority support', 'Custom branding'],
      recommended: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 1499,
      features: ['Unlimited users', 'Unlimited applications', 'Full customization', '100GB storage', 'Dedicated support', 'White-label', 'API access']
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from organization name
    if (field === 'organizationName') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const validateStep = () => {
    setError('');
    
    switch(step) {
      case 1:
        if (!formData.organizationName.trim()) {
          setError('Organization name is required');
          return false;
        }
        if (!formData.slug.trim()) {
          setError('Organization slug is required');
          return false;
        }
        break;
        
      case 2:
        if (!formData.contactEmail.trim() || !formData.contactEmail.includes('@')) {
          setError('Valid contact email is required');
          return false;
        }
        if (!formData.contactName.trim()) {
          setError('Contact name is required');
          return false;
        }
        break;
        
      case 3:
        if (!formData.adminEmail.trim() || !formData.adminEmail.includes('@')) {
          setError('Valid admin email is required');
          return false;
        }
        if (!formData.adminUsername.trim()) {
          setError('Admin username is required');
          return false;
        }
        if (formData.adminPassword.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        if (formData.adminPassword !== formData.adminPasswordConfirm) {
          setError('Passwords do not match');
          return false;
        }
        break;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Create organization and admin account
      const response = await axios.post(`${api}/organizations/signup`, {
        organization: {
          name: formData.organizationName,
          type: formData.organizationType,
          slug: formData.slug,
          contact_name: formData.contactName,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          settings: {
            logoUrl: formData.logoUrl,
            primaryColor: formData.primaryColor,
            secondaryColor: formData.secondaryColor
          }
        },
        admin: {
          username: formData.adminUsername,
          email: formData.adminEmail,
          password: formData.adminPassword,
          full_name: formData.contactName
        },
        plan: {
          tier: formData.planTier,
          billing_cycle: formData.billingCycle
        }
      });
      
      // Success!
      if (onSignupComplete) {
        onSignupComplete(response.data);
      }
      
      setStep(6); // Success step
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.detail || 'Failed to create organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        {['Organization', 'Contact', 'Admin', 'Plan', 'Customize'].map((label, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '0.75rem',
              color: step > index + 1 ? 'var(--color-primary)' : 
                     step === index + 1 ? 'var(--color-text-primary)' : 
                     'var(--color-text-secondary)'
            }}
          >
            {label}
          </div>
        ))}
      </div>
      <div style={{
        width: '100%',
        height: '4px',
        background: 'var(--color-border-light)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${(step / 5) * 100}%`,
          height: '100%',
          background: 'var(--color-primary)',
          transition: 'width var(--transition-base)'
        }} />
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
        Organization Information
      </h3>
      <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
        Tell us about your organization
      </p>
      
      <div className="form-group">
        <label>Organization Name *</label>
        <input
          type="text"
          placeholder="e.g., Danville Neighborhood Development Corporation"
          value={formData.organizationName}
          onChange={(e) => handleInputChange('organizationName', e.target.value)}
        />
      </div>
      
      <div className="form-group">
        <label>Organization Type *</label>
        <select
          value={formData.organizationType}
          onChange={(e) => handleInputChange('organizationType', e.target.value)}
        >
          {orgTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label>URL Slug *</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            yourplatform.com/
          </span>
          <input
            type="text"
            placeholder="your-organization"
            value={formData.slug}
            onChange={(e) => handleInputChange('slug', e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
          This will be your organization's unique URL identifier
        </small>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
        Contact Information
      </h3>
      <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
        Primary contact details for your organization
      </p>
      
      <div className="form-group">
        <label>Contact Name *</label>
        <input
          type="text"
          placeholder="John Smith"
          value={formData.contactName}
          onChange={(e) => handleInputChange('contactName', e.target.value)}
        />
      </div>
      
      <div className="form-group">
        <label>Contact Email *</label>
        <input
          type="email"
          placeholder="contact@organization.org"
          value={formData.contactEmail}
          onChange={(e) => handleInputChange('contactEmail', e.target.value)}
        />
      </div>
      
      <div className="form-group">
        <label>Phone Number</label>
        <input
          type="tel"
          placeholder="(555) 123-4567"
          value={formData.contactPhone}
          onChange={(e) => handleInputChange('contactPhone', e.target.value)}
        />
      </div>
      
      <div className="form-group">
        <label>Address</label>
        <input
          type="text"
          placeholder="123 Main Street"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
        />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>City</label>
          <input
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>State</label>
          <input
            type="text"
            placeholder="VA"
            maxLength="2"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
          />
        </div>
        <div className="form-group">
          <label>ZIP Code</label>
          <input
            type="text"
            placeholder="12345"
            maxLength="5"
            value={formData.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
        Administrator Account
      </h3>
      <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
        Create your admin login credentials
      </p>
      
      <div className="form-group">
        <label>Admin Username *</label>
        <input
          type="text"
          placeholder="admin_username"
          value={formData.adminUsername}
          onChange={(e) => handleInputChange('adminUsername', e.target.value)}
        />
      </div>
      
      <div className="form-group">
        <label>Admin Email *</label>
        <input
          type="email"
          placeholder="admin@organization.org"
          value={formData.adminEmail}
          onChange={(e) => handleInputChange('adminEmail', e.target.value)}
        />
      </div>
      
      <div className="form-group">
        <label>Password *</label>
        <input
          type="password"
          placeholder="At least 8 characters"
          value={formData.adminPassword}
          onChange={(e) => handleInputChange('adminPassword', e.target.value)}
        />
      </div>
      
      <div className="form-group">
        <label>Confirm Password *</label>
        <input
          type="password"
          placeholder="Re-enter password"
          value={formData.adminPasswordConfirm}
          onChange={(e) => handleInputChange('adminPasswordConfirm', e.target.value)}
        />
      </div>
      
      <div style={{
        padding: '1rem',
        background: '#E8F5E9',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.875rem',
        color: '#333'
      }}>
        <strong>Password Requirements:</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li>At least 8 characters long</li>
          <li>Include letters and numbers</li>
          <li>Use a unique password</li>
        </ul>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
        Choose Your Plan
      </h3>
      <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
        Select the plan that fits your organization's needs
      </p>
      
      <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
        {plans.map(plan => (
          <div
            key={plan.id}
            onClick={() => handleInputChange('planTier', plan.id)}
            style={{
              padding: '1.5rem',
              border: formData.planTier === plan.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              background: formData.planTier === plan.id ? '#F0F9F0' : 'white',
              transition: 'all var(--transition-base)',
              position: 'relative'
            }}
          >
            {plan.recommended && (
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '20px',
                background: 'var(--color-primary)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                RECOMMENDED
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>{plan.name}</h4>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)', marginTop: '0.5rem' }}>
                  ${plan.price}
                  <span style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--color-text-secondary)' }}>
                    /month
                  </span>
                </div>
              </div>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: `2px solid ${formData.planTier === plan.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: formData.planTier === plan.id ? 'var(--color-primary)' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.875rem'
              }}>
                {formData.planTier === plan.id && '✓'}
              </div>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {plan.features.map((feature, index) => (
                <li key={index} style={{ 
                  padding: '0.5rem 0',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ color: 'var(--color-primary)' }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="form-group">
        <label>Billing Cycle</label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => handleInputChange('billingCycle', 'monthly')}
            style={{
              flex: 1,
              padding: '1rem',
              background: formData.billingCycle === 'monthly' ? 'var(--color-primary)' : 'white',
              color: formData.billingCycle === 'monthly' ? 'white' : 'var(--color-text-primary)',
              border: `1px solid ${formData.billingCycle === 'monthly' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => handleInputChange('billingCycle', 'annual')}
            style={{
              flex: 1,
              padding: '1rem',
              background: formData.billingCycle === 'annual' ? 'var(--color-primary)' : 'white',
              color: formData.billingCycle === 'annual' ? 'white' : 'var(--color-text-primary)',
              border: `1px solid ${formData.billingCycle === 'annual' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '600',
              position: 'relative'
            }}
          >
            Annual
            <div style={{ fontSize: '0.75rem', fontWeight: '400', marginTop: '0.25rem' }}>
              Save 2 months
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div>
      <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
        Customize Your Portal
      </h3>
      <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
        Optional: Add branding (you can customize this later)
      </p>
      
      <div className="form-group">
        <label>Logo URL (Optional)</label>
        <input
          type="url"
          placeholder="https://example.com/logo.png"
          value={formData.logoUrl}
          onChange={(e) => handleInputChange('logoUrl', e.target.value)}
        />
        <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
          You can upload a logo later from the admin dashboard
        </small>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Primary Color</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="color"
              value={formData.primaryColor}
              onChange={(e) => handleInputChange('primaryColor', e.target.value)}
              style={{ width: '60px', height: '40px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={formData.primaryColor}
              onChange={(e) => handleInputChange('primaryColor', e.target.value)}
              placeholder="#5CB85C"
              style={{ flex: 1 }}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Secondary Color</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="color"
              value={formData.secondaryColor}
              onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
              style={{ width: '60px', height: '40px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
            />
            <input
              type="text"
              value={formData.secondaryColor}
              onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
              placeholder="#007bff"
              style={{ flex: 1 }}
            />
          </div>
        </div>
      </div>
      
      <div style={{
        padding: '1.5rem',
        background: 'white',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        marginTop: '1.5rem'
      }}>
        <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem' }}>
          Preview
        </div>
        <div style={{
          background: `linear-gradient(135deg, ${formData.primaryColor} 0%, ${formData.secondaryColor} 100%)`,
          padding: '2rem',
          borderRadius: 'var(--radius-md)',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            {formData.organizationName || 'Your Organization'}
          </div>
          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', opacity: 0.9 }}>
            Resource Hub
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'var(--color-success-light)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem',
        fontSize: '3rem'
      }}>
        ✓
      </div>
      
      <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
        Welcome to Your Portal!
      </h2>
      
      <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
        Your organization has been successfully created.
      </p>
      
      <div style={{
        background: '#F0F9F0',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '2rem',
        textAlign: 'left'
      }}>
        <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem' }}>
          Next Steps:
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-primary)' }}>1.</span>
            Check your email for verification link
          </li>
          <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-primary)' }}>2.</span>
            Complete payment setup to activate your account
          </li>
          <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-primary)' }}>3.</span>
            Log in and customize your portal
          </li>
          <li style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-primary)' }}>4.</span>
            Invite your team members
          </li>
        </ul>
      </div>
      
      <button
        className="btn-primary"
        onClick={() => window.location.href = `/admin/login?org=${formData.slug}`}
        style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
      >
        Go to Admin Login
      </button>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-background)',
      padding: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '700px',
        width: '100%',
        background: 'white',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        padding: '3rem'
      }}>
        {step < 6 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Create Your Organization
              </h1>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Get started with your enterprise resource hub
              </p>
            </div>
            
            {renderProgressBar()}
          </>
        )}
        
        {error && (
          <div style={{
            padding: '1rem',
            background: 'var(--color-error-light)',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-error-dark)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}
        
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
        
        {step < 6 && (
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid var(--color-border-light)'
          }}>
            {step > 1 && (
              <button
                onClick={handlePrevious}
                disabled={loading}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Previous
              </button>
            )}
            
            {step < 5 && (
              <button
                onClick={handleNext}
                disabled={loading}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                Next
              </button>
            )}
            
            {step === 5 && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                {loading ? 'Creating...' : 'Complete Setup'}
              </button>
            )}
          </div>
        )}
        
        {step < 6 && (
          <div style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)'
          }}>
            Already have an account?{' '}
            <a href="/admin/login" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none' }}>
              Sign in
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationSignup;
