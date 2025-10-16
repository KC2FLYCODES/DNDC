import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DNDC_ORG_ID = "97fef08b-4fde-484d-b334-4b9450f9a280";

const ProgramManagement = ({ api }) => {
  const [programs, setPrograms] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedTab, setSelectedTab] = useState('programs');
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [programData, setProgramData] = useState({
    name: '',
    type: 'forgivable_loan',
    description: '',
    eligibility_criteria: [{ criteria: '' }],
    geographic_scope: '',
    financial_terms: {
      maximum_amount: '',
      loan_term: '',
      interest_rate: '',
      forgiveness_structure: ''
    },
    required_documents: [],
    faqs: [{ question: '', answer: '' }],
    status: 'active',
    application_deadline: ''
  });

  const programTypes = [
    { value: 'forgivable_loan', label: 'Forgivable Loan', icon: '🏠' },
    { value: 'emergency_repair', label: 'Emergency Repair', icon: '🔧' },
    { value: 'weatherization', label: 'Weatherization', icon: '🌡️' },
    { value: 'down_payment_assistance', label: 'Down Payment Assistance', icon: '💰' },
    { value: 'accessibility', label: 'Accessibility', icon: '♿' },
    { value: 'custom', label: 'Custom Program', icon: '📋' }
  ];

  const commonDocuments = [
    'Photo ID', 'Proof of Income', 'Property Deed', 'Tax Returns', 
    'Insurance Information', 'Bank Statements', 'Social Security Card',
    'Utility Bills', 'Property Tax Records', 'Contractor Estimates'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [programsResponse, dashboardResponse] = await Promise.all([
        axios.get(`${api}/dndc/programs`),
        axios.get(`${api}/dndc/programs-dashboard`)
      ]);
      
      setPrograms(programsResponse.data);
      
      // Get recent applications from all programs
      if (dashboardResponse.data.recent_applications) {
        setApplications(dashboardResponse.data.recent_applications);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load program data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgram = async (e) => {
    e.preventDefault();
    
    try {
      const processedData = {
        ...programData,
        financial_terms: {
          maximum_amount: parseFloat(programData.financial_terms.maximum_amount) || 0,
          loan_term: parseInt(programData.financial_terms.loan_term) || 0,
          interest_rate: parseFloat(programData.financial_terms.interest_rate) || 0,
          forgiveness_structure: programData.financial_terms.forgiveness_structure
        },
        eligibility_criteria: programData.eligibility_criteria.filter(c => c.criteria.trim()),
        faqs: programData.faqs.filter(f => f.question.trim() && f.answer.trim()),
        application_deadline: programData.application_deadline || null
      };

      if (editingProgram) {
        await axios.put(`${api}/dndc/programs/${editingProgram.id}`, processedData);
      } else {
        await axios.post(`${api}/dndc/programs`, processedData);
      }

      resetForm();
      fetchData();
    } catch (err) {
      setError('Failed to save program');
      console.error('Error saving program:', err);
    }
  };

  const resetForm = () => {
    setProgramData({
      name: '',
      type: 'forgivable_loan',
      description: '',
      eligibility_criteria: [{ criteria: '' }],
      geographic_scope: '',
      financial_terms: {
        maximum_amount: '',
        loan_term: '',
        interest_rate: '',
        forgiveness_structure: ''
      },
      required_documents: [],
      faqs: [{ question: '', answer: '' }],
      status: 'active',
      application_deadline: ''
    });
    setEditingProgram(null);
    setShowProgramForm(false);
  };

  const handleEditProgram = (program) => {
    setProgramData({
      ...program,
      financial_terms: program.financial_terms || {},
      eligibility_criteria: program.eligibility_criteria || [{ criteria: '' }],
      faqs: program.faqs || [{ question: '', answer: '' }],
      required_documents: program.required_documents || []
    });
    setEditingProgram(program);
    setShowProgramForm(true);
  };

  const handleDeleteProgram = async (programId) => {
    if (!window.confirm('Are you sure you want to archive this program?')) {
      return;
    }

    try {
      await axios.delete(`${api}/dndc/programs/${programId}`);
      fetchData();
    } catch (err) {
      setError('Failed to archive program');
      console.error('Error archiving program:', err);
    }
  };

  const addEligibilityCriteria = () => {
    setProgramData({
      ...programData,
      eligibility_criteria: [...programData.eligibility_criteria, { criteria: '' }]
    });
  };

  const updateEligibilityCriteria = (index, value) => {
    const updated = [...programData.eligibility_criteria];
    updated[index] = { criteria: value };
    setProgramData({ ...programData, eligibility_criteria: updated });
  };

  const removeEligibilityCriteria = (index) => {
    const updated = programData.eligibility_criteria.filter((_, i) => i !== index);
    setProgramData({ ...programData, eligibility_criteria: updated });
  };

  const addFaq = () => {
    setProgramData({
      ...programData,
      faqs: [...programData.faqs, { question: '', answer: '' }]
    });
  };

  const updateFaq = (index, field, value) => {
    const updated = [...programData.faqs];
    updated[index] = { ...updated[index], [field]: value };
    setProgramData({ ...programData, faqs: updated });
  };

  const removeFaq = (index) => {
    const updated = programData.faqs.filter((_, i) => i !== index);
    setProgramData({ ...programData, faqs: updated });
  };

  const toggleRequiredDocument = (doc) => {
    const updated = programData.required_documents.includes(doc)
      ? programData.required_documents.filter(d => d !== doc)
      : [...programData.required_documents, doc];
    setProgramData({ ...programData, required_documents: updated });
  };

  if (loading) {
    return <div className="loading">Loading program management...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem'
      }}>
        <div>
          <h2 style={{ color: '#2d3748', margin: 0, marginBottom: '0.5rem' }}>
            Program Management
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Create and manage housing assistance programs for DNDC
          </p>
        </div>
        <button
          onClick={() => setShowProgramForm(true)}
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          + New Program
        </button>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <button
          onClick={() => setSelectedTab('programs')}
          style={{
            background: selectedTab === 'programs' ? 'var(--color-background)' : 'transparent',
            border: 'none',
            padding: '1rem 1.5rem',
            borderRadius: '8px 8px 0 0',
            fontWeight: '600',
            color: selectedTab === 'programs' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            borderBottom: selectedTab === 'programs' ? '2px solid var(--color-primary)' : '2px solid transparent'
          }}
        >
          📋 Programs ({programs.length})
        </button>
        <button
          onClick={() => setSelectedTab('applications')}
          style={{
            background: selectedTab === 'applications' ? 'var(--color-background)' : 'transparent',
            border: 'none',
            padding: '1rem 1.5rem',
            borderRadius: '8px 8px 0 0',
            fontWeight: '600',
            color: selectedTab === 'applications' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            borderBottom: selectedTab === 'applications' ? '2px solid var(--color-primary)' : '2px solid transparent'
          }}
        >
          📄 Applications ({applications.length})
        </button>
      </div>

      {/* Programs Tab */}
      {selectedTab === 'programs' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {programs.map(program => (
            <div key={program.id} style={{
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>
                      {programTypes.find(t => t.value === program.type)?.icon || '📋'}
                    </span>
                    <h3 style={{ color: '#2d3748', margin: 0 }}>{program.name}</h3>
                    <span style={{
                      background: program.status === 'active' ? '#c6f6d5' : '#fed7d7',
                      color: program.status === 'active' ? '#2f855a' : '#c53030',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {program.status}
                    </span>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                    {program.description?.substring(0, 150)}...
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEditProgram(program)}
                    style={{
                      background: 'white',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProgram(program.id)}
                    style={{
                      background: 'white',
                      border: '1px solid #fed7d7',
                      color: '#c53030',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Archive
                  </button>
                </div>
              </div>
              
              {program.financial_terms && (
                <div style={{
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem',
                  fontSize: '0.9rem'
                }}>
                  {program.financial_terms.maximum_amount && (
                    <div>
                      <div style={{ fontWeight: '600', color: '#2d3748' }}>Max Amount</div>
                      <div style={{ color: 'var(--color-text-primary)' }}>
                        ${program.financial_terms.maximum_amount?.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {program.financial_terms.loan_term && (
                    <div>
                      <div style={{ fontWeight: '600', color: '#2d3748' }}>Term</div>
                      <div style={{ color: 'var(--color-text-primary)' }}>{program.financial_terms.loan_term} years</div>
                    </div>
                  )}
                  {program.financial_terms.interest_rate !== undefined && (
                    <div>
                      <div style={{ fontWeight: '600', color: '#2d3748' }}>Rate</div>
                      <div style={{ color: 'var(--color-text-primary)' }}>{program.financial_terms.interest_rate}%</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Applications Tab */}
      {selectedTab === 'applications' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {applications.map(app => (
            <div key={app.id} style={{
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div>
                  <h4 style={{ color: '#2d3748', margin: 0, marginBottom: '0.25rem' }}>
                    {app.applicant_name}
                  </h4>
                  <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                    {app.applicant_email} • Submitted {new Date(app.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <span style={{
                  background: app.status === 'pending' ? '#fef3c7' : 
                            app.status === 'approved' ? '#c6f6d5' : '#fed7d7',
                  color: app.status === 'pending' ? '#92400e' : 
                        app.status === 'approved' ? '#2f855a' : '#c53030',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {app.status.replace('_', ' ')}
                </span>
              </div>
              
              {app.application_data?.description && (
                <p style={{
                  color: 'var(--color-text-primary)',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  background: 'var(--color-background)',
                  padding: '1rem',
                  borderRadius: '8px',
                  margin: 0
                }}>
                  "{app.application_data.description.substring(0, 200)}..."
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Program Form Modal */}
      {showProgramForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              padding: '2rem',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ color: '#2d3748', margin: 0 }}>
                {editingProgram ? 'Edit Program' : 'Create New Program'}
              </h3>
              <button
                onClick={resetForm}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProgram} style={{ padding: '2rem' }}>
              {/* Basic Information */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>Basic Information</h4>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Program Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={programData.name}
                    onChange={(e) => setProgramData({ ...programData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Program Type *
                    </label>
                    <select
                      required
                      value={programData.type}
                      onChange={(e) => setProgramData({ ...programData, type: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px'
                      }}
                    >
                      {programTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Status
                    </label>
                    <select
                      value={programData.status}
                      onChange={(e) => setProgramData({ ...programData, status: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px'
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Description *
                  </label>
                  <textarea
                    required
                    rows="4"
                    value={programData.description}
                    onChange={(e) => setProgramData({ ...programData, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      resize: 'vertical'
                    }}
                    maxLength={2000}
                  />
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                    {programData.description.length}/2000 characters
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Geographic Scope
                  </label>
                  <input
                    type="text"
                    value={programData.geographic_scope}
                    onChange={(e) => setProgramData({ ...programData, geographic_scope: e.target.value })}
                    placeholder="e.g., Danville city limits, specific neighborhoods, zip codes"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Application Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={programData.application_deadline}
                    onChange={(e) => setProgramData({ ...programData, application_deadline: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px'
                    }}
                  />
                </div>
              </div>

              {/* Financial Terms */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>Financial Terms</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Maximum Amount ($)
                    </label>
                    <input
                      type="number"
                      value={programData.financial_terms.maximum_amount}
                      onChange={(e) => setProgramData({
                        ...programData,
                        financial_terms: {
                          ...programData.financial_terms,
                          maximum_amount: e.target.value
                        }
                      })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Loan Term (Years)
                    </label>
                    <input
                      type="number"
                      value={programData.financial_terms.loan_term}
                      onChange={(e) => setProgramData({
                        ...programData,
                        financial_terms: {
                          ...programData.financial_terms,
                          loan_term: e.target.value
                        }
                      })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={programData.financial_terms.interest_rate}
                    onChange={(e) => setProgramData({
                      ...programData,
                      financial_terms: {
                        ...programData.financial_terms,
                        interest_rate: e.target.value
                      }
                    })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Forgiveness Structure
                  </label>
                  <textarea
                    value={programData.financial_terms.forgiveness_structure}
                    onChange={(e) => setProgramData({
                      ...programData,
                      financial_terms: {
                        ...programData.financial_terms,
                        forgiveness_structure: e.target.value
                      }
                    })}
                    placeholder="e.g., Loan forgiven at rate of 1/15th per year of continued occupancy"
                    rows="2"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              {/* Eligibility Criteria */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '1rem' 
                }}>
                  <h4 style={{ color: '#2d3748', margin: 0 }}>Eligibility Criteria</h4>
                  <button
                    type="button"
                    onClick={addEligibilityCriteria}
                    style={{
                      background: '#f0fff4',
                      border: '1px solid #c6f6d5',
                      color: '#2f855a',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Criteria
                  </button>
                </div>
                
                {programData.eligibility_criteria.map((criteria, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginBottom: '0.5rem',
                    alignItems: 'center'
                  }}>
                    <input
                      type="text"
                      value={criteria.criteria}
                      onChange={(e) => updateEligibilityCriteria(index, e.target.value)}
                      placeholder="Enter eligibility requirement"
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px'
                      }}
                    />
                    {programData.eligibility_criteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEligibilityCriteria(index)}
                        style={{
                          background: '#fed7d7',
                          border: '1px solid #feb2b2',
                          color: '#c53030',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Required Documents */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>Required Documents</h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '0.5rem' 
                }}>
                  {commonDocuments.map(doc => (
                    <label key={doc} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={programData.required_documents.includes(doc)}
                        onChange={() => toggleRequiredDocument(doc)}
                      />
                      <span style={{ fontSize: '0.9rem' }}>{doc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* FAQs */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '1rem' 
                }}>
                  <h4 style={{ color: '#2d3748', margin: 0 }}>Frequently Asked Questions</h4>
                  <button
                    type="button"
                    onClick={addFaq}
                    style={{
                      background: '#f0fff4',
                      border: '1px solid #c6f6d5',
                      color: '#2f855a',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    + Add FAQ
                  </button>
                </div>

                {programData.faqs.map((faq, index) => (
                  <div key={index} style={{ 
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFaq(index, 'question', e.target.value)}
                        placeholder="Question"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <textarea
                        value={faq.answer}
                        onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                        placeholder="Answer"
                        rows="2"
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          resize: 'vertical'
                        }}
                      />
                      {programData.faqs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFaq(index)}
                          style={{
                            background: '#fed7d7',
                            border: '1px solid #feb2b2',
                            color: '#c53030',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    background: 'white',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    padding: '1rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                    border: 'none',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {editingProgram ? 'Update Program' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramManagement;