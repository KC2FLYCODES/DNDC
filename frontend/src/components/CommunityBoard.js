import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CommunityBoard = ({ api, analytics }) => {
  const [activeSection, setActiveSection] = useState('stories');
  const [successStories, setSuccessStories] = useState([]);
  const [events, setEvents] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchData();
    analytics.trackPageView('community_board');
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [storiesRes, eventsRes, testimonialsRes] = await Promise.all([
        axios.get(`${api}/success-stories`),
        axios.get(`${api}/community-events`),
        axios.get(`${api}/testimonials`)
      ]);
      
      setSuccessStories(storiesRes.data);
      setEvents(eventsRes.data);
      setTestimonials(testimonialsRes.data);
    } catch (err) {
      console.error('Error fetching community board data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const renderStories = () => (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Success Stories</h3>
        <p style={{ color: 'var(--color-text-secondary)' }}>Real stories from real residents who found success through DNDC programs</p>
      </div>

      {selectedStory ? (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <button
            onClick={() => setSelectedStory(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', marginBottom: '1rem' }}
          >
            ← Back to stories
          </button>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>{selectedStory.title}</h2>
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>
              {selectedStory.resident_name}
            </span>
            {selectedStory.program_name && (
              <span style={{ marginLeft: '1rem', background: '#e6f2ff', color: 'var(--color-primary)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                {selectedStory.program_name}
              </span>
            )}
          </div>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--color-text-primary)', marginBottom: '1.5rem' }}>
            {selectedStory.story_text}
          </p>
          {selectedStory.achievement_date && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Achievement Date: {formatDate(selectedStory.achievement_date)}
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {successStories.map(story => (
            <div
              key={story.id}
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                border: story.is_featured ? '2px solid #fbbf24' : 'none'
              }}
              onClick={() => {
                setSelectedStory(story);
                analytics.trackButtonClick(`view_story_${story.id}`, 'community_board');
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {story.is_featured && (
                <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', display: 'inline-block', marginBottom: '0.75rem' }}>
                  ⭐ FEATURED STORY
                </div>
              )}
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#1a202c' }}>
                {story.title}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                {story.resident_name}
              </p>
              <p style={{ color: 'var(--color-text-primary)', lineHeight: '1.6', marginBottom: '1rem' }}>
                {story.story_text.substring(0, 150)}...
              </p>
              {story.program_name && (
                <span style={{ background: '#e6f2ff', color: 'var(--color-primary)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500' }}>
                  {story.program_name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEvents = () => (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Community Events</h3>
        <p style={{ color: 'var(--color-text-secondary)' }}>Join us for workshops, celebrations, and community gatherings</p>
      </div>

      {selectedEvent ? (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <button
            onClick={() => setSelectedEvent(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', marginBottom: '1rem' }}
          >
            ← Back to events
          </button>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>{selectedEvent.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem', padding: '1.5rem', background: '#f7fafc', borderRadius: '8px' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Date & Time</p>
              <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>📅 {formatDate(selectedEvent.event_date)}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Location</p>
              <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>📍 {selectedEvent.location}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Event Type</p>
              <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                {selectedEvent.event_type.charAt(0).toUpperCase() + selectedEvent.event_type.slice(1)}
              </p>
            </div>
          </div>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--color-text-primary)', marginBottom: '2rem' }}>
            {selectedEvent.description}
          </p>
          {selectedEvent.registration_required && (
            <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Registration Required</h4>
              <p style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                Spots Available: {selectedEvent.max_attendees ? (selectedEvent.max_attendees - selectedEvent.current_attendees) : 'Unlimited'}
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                Contact: {selectedEvent.contact_email || selectedEvent.contact_phone}
              </p>
            </div>
          )}
          <button
            onClick={() => analytics.trackButtonClick(`register_event_${selectedEvent.id}`, 'community_board')}
            className="btn-primary"
            style={{ width: '100%' }}
          >
            {selectedEvent.registration_required ? 'Register for Event' : 'Learn More'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {events.map(event => {
            const eventDate = new Date(event.event_date);
            const isUpcoming = eventDate >= new Date();
            
            return (
              <div
                key={event.id}
                style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  opacity: isUpcoming ? 1 : 0.6
                }}
                onClick={() => {
                  setSelectedEvent(event);
                  analytics.trackButtonClick(`view_event_${event.id}`, 'community_board');
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{
                    background: isUpcoming ? '#dcfce7' : '#f3f4f6',
                    color: isUpcoming ? '#166534' : '#6b7280',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {isUpcoming ? '📅 UPCOMING' : '📝 PAST EVENT'}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#1a202c' }}>
                  {event.title}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  📅 {formatDate(event.event_date)}
                </p>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  📍 {event.location}
                </p>
                <p style={{ color: 'var(--color-text-primary)', lineHeight: '1.6' }}>
                  {event.description.substring(0, 120)}...
                </p>
                {event.registration_required && (
                  <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#fef3c7', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' }}>
                    Registration Required
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderTestimonials = () => (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Community Testimonials</h3>
        <p style={{ color: 'var(--color-text-secondary)' }}>Hear what our community members have to say</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {testimonials.map(testimonial => (
          <div
            key={testimonial.id}
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: testimonial.is_featured ? '2px solid #fbbf24' : '1px solid var(--color-border)'
            }}
          >
            {testimonial.is_featured && (
              <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', display: 'inline-block', marginBottom: '0.75rem' }}>
                ⭐ FEATURED
              </div>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#fbbf24', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                {'★'.repeat(testimonial.rating)}{'☆'.repeat(5 - testimonial.rating)}
              </div>
              <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--color-text-primary)', fontStyle: 'italic' }}>
                "{testimonial.testimonial_text}"
              </p>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <p style={{ fontWeight: '600', color: '#1a202c', marginBottom: '0.25rem' }}>
                {testimonial.resident_name}
              </p>
              {testimonial.program_name && (
                <span style={{ background: '#e6f2ff', color: 'var(--color-primary)', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '500' }}>
                  {testimonial.program_name}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1a202c' }}>
          🌟 Community Board
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
          Celebrating our community's successes and upcoming events
        </p>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid var(--color-border)' }}>
        {[
          { id: 'stories', label: 'Success Stories', icon: '🎯' },
          { id: 'events', label: 'Events', icon: '📅' },
          { id: 'testimonials', label: 'Testimonials', icon: '💬' }
        ].map(section => (
          <button
            key={section.id}
            onClick={() => {
              setActiveSection(section.id);
              setSelectedStory(null);
              setSelectedEvent(null);
              analytics.trackButtonClick(`community_board_${section.id}`, 'community_board');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '1rem 1.5rem',
              fontSize: '1.05rem',
              fontWeight: '600',
              color: activeSection === section.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeSection === section.id ? '3px solid var(--color-primary)' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {section.icon} {section.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          Loading community content...
        </div>
      ) : (
        <>
          {activeSection === 'stories' && renderStories()}
          {activeSection === 'events' && renderEvents()}
          {activeSection === 'testimonials' && renderTestimonials()}
        </>
      )}
    </div>
  );
};

export default CommunityBoard;