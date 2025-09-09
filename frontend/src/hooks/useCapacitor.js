import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export const useCapacitor = () => {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState('web');

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    setPlatform(Capacitor.getPlatform());
    
    if (Capacitor.isNativePlatform()) {
      initializeNativeFeatures();
    }
  }, []);

  const initializeNativeFeatures = async () => {
    // Initialize push notifications
    try {
      await PushNotifications.requestPermissions();
      await PushNotifications.register();
      
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ' + token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error: ', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed: ', notification);
      });
    } catch (error) {
      console.warn('Push notifications not available:', error);
    }

    // Initialize local notifications
    try {
      await LocalNotifications.requestPermissions();
    } catch (error) {
      console.warn('Local notifications not available:', error);
    }
  };

  const scheduleNotification = async (title, body, date) => {
    if (!isNative) return false;
    
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: { at: date },
            sound: 'beep.wav',
            attachments: [],
            actionTypeId: '',
            extra: {}
          }
        ]
      });
      return true;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return false;
    }
  };

  const takePicture = async () => {
    if (!isNative) return null;
    
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      
      return image.dataUrl;
    } catch (error) {
      console.error('Failed to take picture:', error);
      return null;
    }
  };

  const getPicture = async () => {
    if (!isNative) return null;
    
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });
      
      return image.dataUrl;
    } catch (error) {
      console.error('Failed to get picture:', error);
      return null;
    }
  };

  return {
    isNative,
    platform,
    scheduleNotification,
    takePicture,
    getPicture
  };
};

export default useCapacitor;