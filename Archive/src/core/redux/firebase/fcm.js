import { getToken, onMessage, deleteToken } from 'firebase/messaging';
import { messaging } from '../firebase';

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

export const getFCMToken = async () => {
  try {
    if (!messaging) {
      throw new Error('Firebase Messaging is not supported or initialized');
    }
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      throw new Error('Notification permission not granted');
    }

    if (!navigator || !navigator.serviceWorker) {
      throw new Error('Service workers not supported');
    }

    let registration;
    try {
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      registration = existingRegistrations.find(reg => {
        const scriptUrl = reg?.active?.scriptURL || reg?.installing?.scriptURL || reg?.waiting?.scriptURL;
        return scriptUrl && scriptUrl.includes('/firebase-messaging-sw.js');
      });

      if (!registration) {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await new Promise((resolve) => {
          if (registration.active) {
            resolve();
          } else {
            registration.addEventListener('updatefound', () => {
              const worker = registration.installing;
              worker.addEventListener('statechange', () => {
                if (worker.state === 'activated') {
                  resolve();
                }
              });
            });
          }
        });
      }
    } catch (error) {
      throw new Error('Service worker registration failed');
    }

    const currentToken = await getToken(messaging, {
      vapidKey: "BHOg5Asr7ITsXxI4VGWEL0g5chwKGkfAXcRJ7Cs8KRlOybC_qk_Akp_mBBU8-ND0Kqf_lYm3MLukEf2TmyjCYiA",
      serviceWorkerRegistration: registration
    });

    if (currentToken) {
      return currentToken;
    } else {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const retryToken = await getToken(messaging, {
        vapidKey: "BHOg5Asr7ITsXxI4VGWEL0g5chwKGkfAXcRJ7Cs8KRlOybC_qk_Akp_mBBU8-ND0Kqf_lYm3MLukEf2TmyjCYiA",
        serviceWorkerRegistration: registration
      });
      
      if (retryToken) {
        return retryToken;
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const finalToken = await getToken(messaging, {
          vapidKey: "BHOg5Asr7ITsXxI4VGWEL0g5chwKGkfAXcRJ7Cs8KRlOybC_qk_Akp_mBBU8-ND0Kqf_lYm3MLukEf2TmyjCYiA"
        });
        
        if (finalToken) {
          return finalToken;
        } else {
          throw new Error('No FCM token available');
        }
      }
    }
  } catch (error) {
    throw error;
  }
};

export const deleteFCMToken = async () => {
  try {
    if (!messaging) return false;
    await deleteToken(messaging);
    return true;
  } catch (error) {
    return false;
  }
};

export const onMessageListener = () => {
  if (!messaging) {
    return new Promise(() => {});
  }
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};

export const saveFCMTokenToDatabase = async (userId, token) => {
  try {
    const { createDocument, updateDocument, getDocument } = await import('./firestore');

    const tokenDoc = await getDocument('userTokens', userId);

    if (tokenDoc) {
      await updateDocument('userTokens', userId, {
        fcmToken: token,
        updatedAt: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    } else {
      await createDocument('userTokens', {
        userId: userId,
        fcmToken: token,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        isActive: true
      });
    }

    // FCM token saved to database
    return true;
  } catch (error) {
    throw error;
  }
};

export const removeFCMTokenFromDatabase = async (userId) => {
  try {
    const { updateDocument } = await import('./firestore');

    await updateDocument('userTokens', userId, {
      fcmToken: null,
      isActive: false,
      updatedAt: new Date().toISOString()
    });

    // FCM token removed from database
    return true;
  } catch (error) {
    throw error;
  }
};

export const initializeFCMForUser = async (user) => {
  try {
    if (!user || !messaging) {
      return null;
    }

    const token = await getFCMToken();
    await saveFCMTokenToDatabase(user.uid, token);

    return token;
  } catch (error) {
    throw error;
  }
};

export const cleanupFCMForUser = async (userId) => {
  try {
    if (!messaging) return false;
    await deleteFCMToken();

    if (userId) {
      await removeFCMTokenFromDatabase(userId);
    }
    // FCM cleanup completed
    return true;
  } catch (error) {
    return false;
  }
};
