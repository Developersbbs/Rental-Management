const fs = require('fs');

const path = process.argv[2];

if (!path) {
    console.error('❌ Error: Please provide the path to your Firebase service account JSON file.');
    console.log('\nUsage: node format-firebase-key.js <path-to-your-service-account-key.json>');
    process.exit(1);
}

try {
    const rawData = fs.readFileSync(path, 'utf8');
    const data = JSON.parse(rawData);

    if (!data.private_key) {
        throw new Error('JSON file does not contain a "private_key" field.');
    }

    const privateKey = data.private_key;
    const formatted = privateKey.replace(/\n/g, '\\n');

    console.log('\n✅ Key successfully formatted!');
    console.log('\n--------------------------------------------------------------------------------');
    console.log('COPY THE LINE BELOW (including the quotes) AND PASTE IT INTO YOUR .env FILE:');
    console.log('--------------------------------------------------------------------------------\n');
    console.log(`FIREBASE_PRIVATE_KEY="${formatted}"`);
    console.log('\n--------------------------------------------------------------------------------\n');

} catch (err) {
    console.error('❌ Error reading or parsing JSON file:', err.message);
    process.exit(1);
}
