const dotenv = require('dotenv');
dotenv.config();

let pk = process.env.FIREBASE_PRIVATE_KEY;
pk = pk.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');

const lines = pk.split('\n');
lines.forEach((line, i) => {
    console.log(`Line ${i}: length ${line.length}`);
});
