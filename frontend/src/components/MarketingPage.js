import React, { useState } from 'react';

const MarketingPage = () => {
  const [demoRequested, setDemoRequested] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    organization: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleDemoRequest = (e) => {
    e.preventDefault();
    setDemoRequested(true);
    // In production, this would send to your sales system
    console.log('Demo requested:', contactForm);
  };

  const features = [
    {
      category: "Resource Management",
      icon: "🏠",
      items: [
        "Community Resource Directory with categories (Housing, Utilities, Food, Healthcare)",
        "Advanced search and filtering capabilities",
        "Real-time resource updates and availability",
        "Contact information management with click-to-call",
        "Hours and eligibility requirements tracking"
      ]
    },
    {
      category: "Document Management",
      icon: "📋",
      items: [
        "Digital document checklist for housing applications",
        "Secure file upload with progress tracking",
        "Multiple file format support (PDF, Word, Images)",
        "Document replacement and version control",
        "Automated progress calculation and visual indicators"
      ]
    },
    {
      category: "Application Tracking",
      icon: "📊",
      items: [
        "Mission 180 loan application status tracker",
        "Visual progress bars and milestone tracking",
        "Multi-stage workflow (Submitted → Review → Decision)",
        "Document completion tracking",
        "Automated status notifications"
      ]
    },
    {
      category: "Financial Tools",
      icon: "💰",
      items: [
        "Loan payment calculator with multiple scenarios",
        "Income qualification checker using local AMI data",
        "Utility assistance calculator based on FPL guidelines",
        "Real-time calculations with clear explanations",
        "Printable results for client meetings"
      ]
    },
    {
      category: "Communication Hub",
      icon: "📢",
      items: [
        "Community alerts and announcements system",
        "Deadline reminders and important notifications",
        "Program funding updates",
        "Emergency housing alerts",
        "Contact form with automated routing"
      ]
    },
    {
      category: "Admin Dashboard",
      icon: "⚙️",
      items: [
        "Comprehensive admin portal for CDC staff",
        "Application management and status updates",
        "Resource content management (CRUD operations)",
        "Message and inquiry management",
        "Usage analytics and reporting dashboard"
      ]
    },
    {
      category: "Multi-Tenant Architecture",
      icon: "🏢",
      items: [
        "Complete data isolation between CDCs",
        "Custom branding per organization",
        "Scalable infrastructure supporting multiple CDCs",
        "Row-level security for data protection",
        "Individual organization analytics"
      ]
    },
    {
      category: "Mobile & Accessibility",
      icon: "📱",
      items: [
        "Fully responsive design for all devices",
        "Progressive Web App (PWA) capabilities",
        "Offline functionality for essential features",
        "Accessibility compliant (WCAG guidelines)",
        "Touch-optimized interface for mobile users"
      ]
    }
  ];

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
        color: 'white',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            marginBottom: '1rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            CDC Resource Hub Platform
          </h1>
          <p style={{ 
            fontSize: '1.3rem', 
            marginBottom: '2rem', 
            opacity: 0.95,
            maxWidth: '800px',
            margin: '0 auto 2rem'
          }}>
            The complete digital platform designed by Community Development Corporations, 
            for Community Development Corporations. Streamline resident services, 
            manage applications, and empower your community.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn-primary"
              onClick={() => document.getElementById('demo-section').scrollIntoView()}
            >
              Request Demo
            </button>
            <button 
              className="btn-secondary"
              onClick={() => document.getElementById('features-section').scrollIntoView()}
            >
              View Features
            </button>
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div style={{ padding: '4rem 2rem', background: 'var(--color-background)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#2d3748' }}>
            Built by CDCs, for CDCs
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem',
            marginTop: '3rem'
          }}>
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
              <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>Launch in Days, Not Months</h3>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                Skip expensive custom development. Get a proven platform that's already serving 
                residents successfully at DNDC.
              </p>
            </div>
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
              <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>90% Cost Savings</h3>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                Custom development costs $50k-200k+. Our platform delivers the same 
                functionality at a fraction of the cost.
              </p>
            </div>
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
              <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>CDC-Specific Features</h3>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                Every feature is designed for CDC workflows. Housing applications, 
                resource management, and resident services built-in.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features-section" style={{ padding: '4rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            textAlign: 'center', 
            marginBottom: '3rem', 
            color: '#2d3748' 
          }}>
            Complete Platform Features
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '2rem' 
          }}>
            {features.map((feature, index) => (
              <div key={index} style={{
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '2rem',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-4px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  marginBottom: '1.5rem' 
                }}>
                  <div style={{ fontSize: '2rem' }}>{feature.icon}</div>
                  <h3 style={{ 
                    color: '#2d3748', 
                    fontSize: '1.3rem', 
                    fontWeight: '600',
                    margin: 0
                  }}>
                    {feature.category}
                  </h3>
                </div>
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  margin: 0 
                }}>
                  {feature.items.map((item, itemIndex) => (
                    <li key={itemIndex} style={{
                      padding: '0.5rem 0',
                      color: 'var(--color-text-primary)',
                      lineHeight: '1.5',
                      borderBottom: itemIndex < feature.items.length - 1 ? '1px solid var(--color-border)' : 'none',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem'
                    }}>
                      <span style={{ color: '#48bb78', fontWeight: 'bold', flexShrink: 0 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div style={{ padding: '4rem 2rem', background: 'var(--color-background)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#2d3748' }}>
            Simple, Transparent Pricing
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '2px solid var(--color-border)'
            }}>
              <h3 style={{ color: '#2d3748', fontSize: '1.5rem', marginBottom: '1rem' }}>Starter</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '1rem' }}>
                $149<span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>/month</span>
              </div>
              <ul style={{ textAlign: 'left', color: 'var(--color-text-primary)', lineHeight: '2' }}>
                <li>✓ Complete platform access</li>
                <li>✓ Up to 1,000 residents</li>
                <li>✓ Custom domain setup</li>
                <li>✓ Email support</li>
                <li>✓ Monthly updates</li>
              </ul>
            </div>
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.2)',
              border: '2px solid var(--color-primary)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--color-primary)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                Most Popular
              </div>
              <h3 style={{ color: '#2d3748', fontSize: '1.5rem', marginBottom: '1rem' }}>Professional</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '1rem' }}>
                $299<span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}>/month</span>
              </div>
              <ul style={{ textAlign: 'left', color: 'var(--color-text-primary)', lineHeight: '2' }}>
                <li>✓ Everything in Starter</li>
                <li>✓ Up to 5,000 residents</li>
                <li>✓ Priority phone support</li>
                <li>✓ Custom branding</li>
                <li>✓ Advanced analytics</li>
                <li>✓ Staff training included</li>
              </ul>
            </div>
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '2px solid var(--color-border)'
            }}>
              <h3 style={{ color: '#2d3748', fontSize: '1.5rem', marginBottom: '1rem' }}>Enterprise</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '1rem' }}>
                Custom
              </div>
              <ul style={{ textAlign: 'left', color: 'var(--color-text-primary)', lineHeight: '2' }}>
                <li>✓ Unlimited residents</li>
                <li>✓ Custom integrations</li>
                <li>✓ Dedicated support</li>
                <li>✓ On-site training</li>
                <li>✓ SLA guarantees</li>
                <li>✓ Custom features</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Request Section */}
      <div id="demo-section" style={{ padding: '4rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            textAlign: 'center', 
            marginBottom: '2rem', 
            color: '#2d3748' 
          }}>
            See It In Action
          </h2>
          <p style={{ 
            textAlign: 'center', 
            fontSize: '1.2rem', 
            color: 'var(--color-text-secondary)', 
            marginBottom: '3rem' 
          }}>
            Schedule a personalized demo to see how our platform can transform 
            your CDC's resident services.
          </p>
          
          {!demoRequested ? (
            <form onSubmit={handleDemoRequest} style={{ 
              background: 'var(--color-background)', 
              padding: '2rem', 
              borderRadius: '12px',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <input
                  type="text"
                  placeholder="Your Name *"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <input
                  type="text"
                  placeholder="CDC/Organization *"
                  required
                  value={contactForm.organization}
                  onChange={(e) => setContactForm({...contactForm, organization: e.target.value})}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <input
                  type="email"
                  placeholder="Email Address *"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <textarea
                placeholder="Tell us about your CDC's current challenges and needs..."
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                rows="4"
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  marginBottom: '1rem',
                  resize: 'vertical'
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Request Demo
              </button>
            </form>
          ) : (
            <div style={{
              background: '#f0fff4',
              border: '2px solid #48bb78',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h3 style={{ color: '#2f855a', marginBottom: '1rem' }}>Demo Request Received!</h3>
              <p style={{ color: '#2f855a' }}>
                Thank you for your interest! We'll contact you within 24 hours to schedule 
                your personalized demo and answer any questions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        background: '#2d3748', 
        color: 'white', 
        padding: '2rem', 
        textAlign: 'center' 
      }}>
        <p style={{ margin: 0, opacity: 0.8 }}>
          © 2025 CDC Resource Hub Platform. Built with ❤️ for Community Development Corporations.
        </p>
      </div>
    </div>
  );
};

export default MarketingPage;