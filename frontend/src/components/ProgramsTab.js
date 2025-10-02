import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DNDC_ORG_ID = "97fef08b-4fde-484d-b334-4b9450f9a280";

const ProgramsTab = ({ api, analytics }) => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${api}/dndc/programs?status=active`);
      setPrograms(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load programs');
      console.error('Error fetching programs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProgramIcon = (type) => {
    const icons = {
      'forgivable_loan': '🏠',
      'emergency_repair': '🔧',
      'weatherization': '🌡️',
      'down_payment_assistance': '💰',
      'accessibility': '♿',
      'custom': '📋'
    };
    return icons[type] || '📋';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleApplyNow = (program) => {
    setSelectedProgram(program);
    setApplicationData({
      applicant_name: '',
      applicant_email: '',
      applicant_phone: '',
      form_data: {}
    });
    setShowApplicationForm(true);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    if (!applicationData.applicant_name.trim()) {
      setError('Applicant name is required');
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(
        `${api}/organizations/${DNDC_ORG_ID}/programs/${selectedProgram.id}/applications`,
        applicationData
      );
      
      alert('Application submitted successfully! You will be contacted within 5 business days.');
      setShowApplicationForm(false);
      setSelectedProgram(null);
      setApplicationData({});
      
      if (analytics) {
        analytics.trackEvent('program_application_submitted', {
          program_name: selectedProgram.name,
          program_type: selectedProgram.type
        });
      }
    } catch (err) {
      setError('Failed to submit application. Please try again.');
      console.error('Error submitting application:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading programs...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">DNDC Housing Programs</h3>
            <p className="card-subtitle">Explore available housing assistance and community development programs</p>
          </div>
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
      </div>

      {programs.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          color: '#718096',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginTop: '1rem'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            No Active Programs
          </div>
          <div>Check back soon for new program announcements</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1rem' }}>
          {programs.map(program => (
            <div key={program.id} style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ padding: '2rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    borderRadius: '12px',
                    padding: '0.75rem',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {getProgramIcon(program.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      color: '#2d3748', 
                      fontSize: '1.3rem', 
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      {program.name}
                    </h4>
                    <p style={{ 
                      color: '#4a5568', 
                      lineHeight: '1.6',
                      marginBottom: '1rem'
                    }}>
                      {program.description ? program.description.substring(0, 200) + '...' : 'Program details available upon request.'}
                    </p>
                    
                    {/* Key Highlights */}
                    {program.financial_terms && (
                      <div style={{
                        background: '#f0fff4',
                        border: '1px solid #c6f6d5',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ 
                          fontSize: '0.9rem', 
                          fontWeight: '600', 
                          color: '#2f855a',
                          marginBottom: '0.5rem'
                        }}>
                          Program Highlights:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                          {program.financial_terms.maximum_amount && (
                            <div style={{ color: '#2f855a', fontSize: '0.9rem' }}>
                              💰 Up to {formatCurrency(program.financial_terms.maximum_amount)}
                            </div>
                          )}
                          {program.financial_terms.interest_rate === 0 && (
                            <div style={{ color: '#2f855a', fontSize: '0.9rem' }}>
                              ✅ 0% Interest Rate
                            </div>
                          )}
                          {program.financial_terms.loan_term && (
                            <div style={{ color: '#2f855a', fontSize: '0.9rem' }}>
                              📅 {program.financial_terms.loan_term} Year Term
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => setSelectedProgram(program)}
                    style={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      color: '#4a5568',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#f8fafc';
                      e.target.style.borderColor = '#cbd5e0';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.borderColor = '#e2e8f0';
                    }}
                  >
                    📖 Learn More
                  </button>
                  <button
                    onClick={() => handleApplyNow(program)}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    🚀 Apply Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Program Detail Modal */}
      {selectedProgram && !showApplicationForm && (
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
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              padding: '2rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '2rem' }}>{getProgramIcon(selectedProgram.type)}</div>
                <div>
                  <h3 style={{ color: '#2d3748', fontSize: '1.5rem', margin: 0 }}>
                    {selectedProgram.name}
                  </h3>
                  <div style={{ color: '#718096', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                    {selectedProgram.type.replace('_', ' ')} Program
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedProgram(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#718096'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              {/* Description */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>Program Description</h4>
                <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
                  {selectedProgram.description}
                </p>
              </div>

              {/* Eligibility */}
              {selectedProgram.eligibility_criteria && selectedProgram.eligibility_criteria.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>Eligibility Requirements</h4>
                  <ul style={{ color: '#4a5568', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                    {selectedProgram.eligibility_criteria.map((criteria, index) => (
                      <li key={index}>{criteria.criteria}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Financial Terms */}
              {selectedProgram.financial_terms && Object.keys(selectedProgram.financial_terms).length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>Financial Terms</h4>
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}>
                    {selectedProgram.financial_terms.maximum_amount && (
                      <div>
                        <div style={{ fontWeight: '600', color: '#2d3748' }}>Maximum Amount</div>
                        <div style={{ color: '#4a5568' }}>{formatCurrency(selectedProgram.financial_terms.maximum_amount)}</div>
                      </div>
                    )}
                    {selectedProgram.financial_terms.loan_term && (
                      <div>
                        <div style={{ fontWeight: '600', color: '#2d3748' }}>Loan Term</div>
                        <div style={{ color: '#4a5568' }}>{selectedProgram.financial_terms.loan_term} years</div>
                      </div>
                    )}
                    {selectedProgram.financial_terms.interest_rate !== undefined && (
                      <div>
                        <div style={{ fontWeight: '600', color: '#2d3748' }}>Interest Rate</div>
                        <div style={{ color: '#4a5568' }}>{selectedProgram.financial_terms.interest_rate}%</div>
                      </div>
                    )}
                    {selectedProgram.financial_terms.forgiveness_structure && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontWeight: '600', color: '#2d3748' }}>Forgiveness Structure</div>
                        <div style={{ color: '#4a5568' }}>{selectedProgram.financial_terms.forgiveness_structure}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Required Documents */}
              {selectedProgram.required_documents && selectedProgram.required_documents.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>Required Documents</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                    {selectedProgram.required_documents.map((doc, index) => (
                      <div key={index} style={{
                        background: '#f0fff4',
                        border: '1px solid #c6f6d5',
                        borderRadius: '6px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.9rem',
                        color: '#2f855a'
                      }}>
                        📄 {doc}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQs */}
              {selectedProgram.faqs && selectedProgram.faqs.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>Frequently Asked Questions</h4>
                  {selectedProgram.faqs.map((faq, index) => (
                    <div key={index} style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        background: '#f8fafc',
                        padding: '1rem',
                        fontWeight: '600',
                        color: '#2d3748'
                      }}>
                        {faq.question}
                      </div>
                      <div style={{
                        padding: '1rem',
                        color: '#4a5568',
                        lineHeight: '1.6'
                      }}>
                        {faq.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Apply Button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => handleApplyNow(selectedProgram)}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🚀 Apply for this Program
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Form Modal */}
      {showApplicationForm && selectedProgram && (
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
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              padding: '2rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ color: '#2d3748', fontSize: '1.5rem', margin: 0 }}>
                  Apply for {selectedProgram.name}
                </h3>
                <div style={{ color: '#718096', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  Complete the form below to submit your application
                </div>
              </div>
              <button
                onClick={() => {
                  setShowApplicationForm(false);
                  setSelectedProgram(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#718096'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitApplication} style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600', 
                  color: '#2d3748' 
                }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={applicationData.applicant_name}
                  onChange={(e) => setApplicationData({
                    ...applicationData,
                    applicant_name: e.target.value
                  })}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600', 
                    color: '#2d3748' 
                  }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={applicationData.applicant_email}
                    onChange={(e) => setApplicationData({
                      ...applicationData,
                      applicant_email: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600', 
                    color: '#2d3748' 
                  }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={applicationData.applicant_phone}
                    onChange={(e) => setApplicationData({
                      ...applicationData,
                      applicant_phone: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600', 
                  color: '#2d3748' 
                }}>
                  Please describe your current housing situation and how this program would help you:
                </label>
                <textarea
                  rows="4"
                  value={applicationData.form_data?.description || ''}
                  onChange={(e) => setApplicationData({
                    ...applicationData,
                    form_data: {
                      ...applicationData.form_data,
                      description: e.target.value
                    }
                  })}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{
                background: '#fffbeb',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                color: '#92400e'
              }}>
                <strong>Next Steps:</strong> After submitting this application, our team will review your information and contact you within 5 business days to schedule an appointment and discuss required documentation.
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowApplicationForm(false);
                    setSelectedProgram(null);
                  }}
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    color: '#4a5568',
                    padding: '1rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: submitting ? '#cbd5e0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramsTab;