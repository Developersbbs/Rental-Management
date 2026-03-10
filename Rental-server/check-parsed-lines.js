const dotenv = require('dotenv');
dotenv.config();

let pk = process.env.FIREBASE_PRIVATE_KEY;
if (!pk) {
    console.log('No PK');
    process.exit(1);
}

// Mimic firebaseAdmin.js normalization
pk = pk.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');

const lines = pk.split('\n').filter(l => l.length > 0);
lines.forEach((line, i) => {
    console.log(`Line ${i}: length ${line.length} | ${line.substring(0, 10)}...${line.substring(line.length - 10)}`);
});
