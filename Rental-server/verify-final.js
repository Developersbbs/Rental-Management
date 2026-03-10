const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config();

const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!privateKey) {
    console.error('❌ FIREBASE_PRIVATE_KEY is not set');
    process.exit(1);
}

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey
        })
    });
    console.log('✅ Firebase initialized successfully with the multi-line key!');
} catch (error) {
    console.error('❌ Firebase initialization still fails:', error.message);
    console.log('Key length:', privateKey.length);
    process.exit(1);
}
