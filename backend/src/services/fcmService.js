let firebaseApp;

function initFirebase() {
  if (firebaseApp) return;
  const { FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL } = process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
    console.warn('Firebase not configured — push notifications disabled');
    return;
  }
  try {
    const admin = require('firebase-admin');
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: FIREBASE_CLIENT_EMAIL,
      }),
    });
  } catch (err) {
    console.warn('Firebase init failed — push notifications disabled:', err.message);
  }
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
