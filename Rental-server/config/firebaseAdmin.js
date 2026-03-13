const admin = require('firebase-admin');

let serviceAccount;
let bucket;

try {
  // Ensure environment variables are loaded
  require('dotenv').config();

  console.log('🔍 Initializing Firebase Admin SDK...');

  const fs = require('fs');
  const path = require('path');
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) {
    console.log('✅ Loading Firebase configuration from serviceAccountKey.json');
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('✅ FIREBASE_SERVICE_ACCOUNT is set');
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    console.log('✅ Individual Firebase environment variables are set');
    serviceAccount = {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY
    };
  } else {
    console.log('❌ Firebase configuration not found (tried serviceAccountKey.json and env vars)');
    throw new Error('Firebase configuration environment variables or serviceAccountKey.json are missing!');
  }

  // Validate required fields
  if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
    throw new Error('Missing required Firebase service account fields (private_key, client_email, or project_id)');
  }

  // Ensure private key is properly formatted
  if (!serviceAccount.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
    console.warn('⚠️  Warning: Firebase private key may not be properly formatted. Expected PEM format.');
  }

  // Convert escaped newlines to real newlines
  serviceAccount.private_key = serviceAccount.private_key
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n');

  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (!storageBucket) {
    throw new Error('FIREBASE_STORAGE_BUCKET is not defined in environment variables!');
  }

  console.log(`📋 Storage Bucket: ${storageBucket}`);

  // Initialize Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: storageBucket,
  });

  console.log('✅ Firebase admin initialized successfully');

  // Initialize the storage bucket with safety
  try {
    bucket = admin.storage().bucket();
    console.log(`✅ Firebase storage bucket reference obtained: ${bucket.name}`);
  } catch (bucketError) {
    console.warn('⚠️  Warning: Could not initialize Firebase storage bucket:', bucketError.message);
    // Provide a dummy bucket object to prevent crashes in other modules
    bucket = {
      name: 'dummy-bucket',
      file: () => ({
        save: async () => { throw new Error('Firebase Storage not initialized'); },
        makePublic: async () => { throw new Error('Firebase Storage not initialized'); },
        delete: async () => { throw new Error('Firebase Storage not initialized'); },
        getFiles: async () => { throw new Error('Firebase Storage not initialized'); },
      })
    };
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failure:', error.message);
  // Do not re-throw here to allow the server to boot
  console.log('ℹ️  Server will continue to boot without Firebase features.');
}

module.exports = { admin, bucket };