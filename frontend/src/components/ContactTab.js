import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ContactTab = ({ api }) => {
  const [contactInfo, setContactInfo] = useState(null);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const response = await axios.get(`${api}/contact/info`);
      setContactInfo(response.data);
    } catch (err) {
      console.error('Error fetching contact info:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !message.trim()) {
      setError('Name and message are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await axios.post(`${api}/contact`, {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        message: message.trim()
      });

      setSuccess(true);
      setMessage('');
      setName('');
      setEmail('');
      setPhone('');
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAppointment = () => {
    if (contactInfo?.phone) {
      window.open(`tel:${contactInfo.phone}`, '_self');
    }
  };

  return (
    <div>
      {contactInfo && (
        <div className="contact-card">
          <div className="contact-title">{contactInfo.organization}</div>
          <div className="contact-info">📍 {contactInfo.address}</div>
          <div className="contact-info">📞 {contactInfo.phone}</div>
          <div className="contact-info">📧 {contactInfo.email}</div>
          <div className="contact-info">🕒 {contactInfo.hours}</div>
          <button className="btn-primary" onClick={handleScheduleAppointment}>
            Schedule Appointment
          </button>
        </div>
      )}
      
      <div className="contact-card">
        <div className="contact-title">Quick Message</div>
        
        {error && <div className="error">{error}</div>}
        {success && (
          <div style={{ 
            background: '#d4edda', 
            color: '#155724', 
            padding: '1rem', 
            borderRadius: '4px', 
            marginBottom: '1rem' 
          }}>
            Message sent successfully! We'll get back to you soon.
          </div>
        )}
        
        <form onSubmit={handleSendMessage}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Your Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="email"
              placeholder="Your Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="tel"
              placeholder="Your Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <textarea
            placeholder="Type your message here... *"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="message-textarea"
            rows="4"
            required
          />
          
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactTab;