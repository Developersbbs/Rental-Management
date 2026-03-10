const dotenv = require('dotenv');
const admin = require('firebase-admin');
const path = require('path');

dotenv.config();

const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!privateKey) {
    console.error('❌ FIREBASE_PRIVATE_KEY is not set');
    process.exit(1);
}

const normalizedKey = privateKey
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n');

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: normalizedKey
        })
    });
    console.log('✅ Firebase initialized successfully with the new key!');
} catch (error) {
    console.error('❌ Firebase initialization still fails:', error.message);
    process.exit(1);
}
