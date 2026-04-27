let firebaseApp;

function initFirebase() {
  if (firebaseApp) return;
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.warn('Firebase not configured — push notifications disabled');
    return;
  }
  const admin = require('firebase-admin');
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

async function sendPushNotification(fcmToken, { title, body, data }) {
  if (!firebaseApp) return;
  const admin = require('firebase-admin');
  try {
    await admin.messaging(firebaseApp).send({
      token: fcmToken,
      notification: { title, body },
      data: data ?? {},
    });
  } catch (err) {
    console.error('FCM send error:', err.message);
  }
}

module.exports = { initFirebase, sendPushNotification };
