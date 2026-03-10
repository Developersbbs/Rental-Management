const dotenv = require('dotenv');
dotenv.config();

const pk = process.env.FIREBASE_PRIVATE_KEY;
if (!pk) {
    console.log('No PK found');
    process.exit(1);
}

const cleaned = pk
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\\n/g, '')
    .replace(/\n/g, '')
    .replace(/\r/g, '')
    .trim();

console.log('Cleaned length:', cleaned.length);
console.log('Multiple of 4?', cleaned.length % 4 === 0);
if (cleaned.length % 4 !== 0) {
    console.log('Remainder:', cleaned.length % 4);
}
