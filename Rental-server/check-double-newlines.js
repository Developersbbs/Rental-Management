const dotenv = require('dotenv');
dotenv.config();

let pk = process.env.FIREBASE_PRIVATE_KEY;
pk = pk.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');

let doubleNewlines = 0;
for (let i = 0; i < pk.length - 1; i++) {
    if (pk[i] === '\n' && pk[i + 1] === '\n') {
        doubleNewlines++;
    }
}
console.log('Double newlines found:', doubleNewlines);
console.log('Total newlines:', pk.split('\n').length - 1);
