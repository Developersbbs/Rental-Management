
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path as needed
require('dotenv').config();

async function resetPassword() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI is undefined');

        await mongoose.connect(uri);
        console.log('Connected to DB');

        const email = 'admin@gmail.com';
        const newPassword = 'admin123';

        const user = await User.findOne({ email });
        if (!user) {
            console.error(`User with email ${email} not found.`);
            // Optional: Create if not exists, but for now just error
            // return;

            // Actually, let's create it if missing to be safe
            console.log('Creating new admin user...');
            const newUser = new User({
                username: 'admin',
                email: email,
                password: newPassword, // Will be hashed by pre-save hook
                role: 'superadmin',
                status: 'active'
            });
            await newUser.save();
            console.log('Admin user created successfully.');

        } else {
            console.log(`Found user: ${user.username} (${user._id})`);
            user.password = newPassword; // Will be hashed by pre-save hook
            await user.save();
            console.log('Password updated successfully.');
        }

    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

resetPassword();
