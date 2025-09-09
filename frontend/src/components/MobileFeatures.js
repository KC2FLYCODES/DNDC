import React, { useState } from 'react';
import useCapacitor from '../hooks/useCapacitor';

const MobileFeatures = ({ api, analytics }) => {
  const { isNative, platform, takePicture, getPicture, scheduleNotification } = useCapacitor();
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTakePicture = async () => {
    if (!isNative) {
      alert('Camera is only available in the mobile app');
      return;
    }

    try {
      setLoading(true);
      const image = await takePicture();
      if (image) {
        setImageUrl(image);
        analytics?.trackButtonClick('camera_take_picture', 'mobile_features');
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      alert('Failed to take picture');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPicture = async () => {
    if (!isNative) {
      alert('Photo gallery is only available in the mobile app');
      return;
    }

    try {
      setLoading(true);
      const image = await getPicture();
      if (image) {
        setImageUrl(image);
        analytics?.trackButtonClick('camera_select_picture', 'mobile_features');
      }
    } catch (error) {
      console.error('Error selecting picture:', error);
      alert('Failed to select picture');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleReminder = async () => {
    const title = 'DNDC Reminder';
    const body = 'Don\'t forget to upload your required documents for your housing application.';
    const date = new Date(Date.now() + 60000); // 1 minute from now for demo

    const success = await scheduleNotification(title, body, date);
    if (success) {
      alert('Reminder scheduled successfully!');
      analytics?.trackButtonClick('schedule_notification', 'mobile_features');
    } else {
      alert('Notifications are only available in the mobile app');
    }
  };

  if (!isNative) {
    return (
      <div className="mobile-features-prompt">
        <div className="app-download-banner">
          <h3>📱 Get the Mobile App</h3>
          <p>Download the DNDC Resource Hub mobile app for enhanced features:</p>
          <ul>
            <li>📷 Take photos for document uploads</li>
            <li>🔔 Push notifications for important updates</li>
            <li>💾 Offline access to resources</li>
            <li>⚡ Faster, native performance</li>
          </ul>
          <div className="app-store-buttons">
            <button className="btn-primary app-store-btn">
              📱 Download for iOS
            </button>
            <button className="btn-primary app-store-btn">
              🤖 Download for Android
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-features">
      <div className="mobile-features-header">
        <h3>📱 Mobile Features</h3>
        <p>Take advantage of native mobile capabilities</p>
      </div>

      <div className="mobile-feature-section">
        <h4>📷 Camera & Photos</h4>
        <p>Use your device camera to quickly capture documents</p>
        <div className="camera-controls">
          <button 
            className="btn-primary" 
            onClick={handleTakePicture}
            disabled={loading}
          >
            {loading ? 'Taking Photo...' : '📸 Take Photo'}
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSelectPicture}
            disabled={loading}
          >
            {loading ? 'Loading...' : '🖼️ Choose from Gallery'}
          </button>
        </div>
        
        {imageUrl && (
          <div className="image-preview">
            <h5>Captured Image:</h5>
            <img 
              src={imageUrl} 
              alt="Captured document" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '200px', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }} 
            />
          </div>
        )}
      </div>

      <div className="mobile-feature-section">
        <h4>🔔 Notifications</h4>
        <p>Set reminders for important deadlines</p>
        <button 
          className="btn-primary" 
          onClick={handleScheduleReminder}
        >
          ⏰ Schedule Document Reminder
        </button>
      </div>

      <div className="mobile-feature-section">
        <h4>📊 App Information</h4>
        <div className="app-info">
          <div className="info-item">
            <strong>Platform:</strong> {platform}
          </div>
          <div className="info-item">
            <strong>Version:</strong> 1.0.0
          </div>
          <div className="info-item">
            <strong>Status:</strong> Native App Mode
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileFeatures;