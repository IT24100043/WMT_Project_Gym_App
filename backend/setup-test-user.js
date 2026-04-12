/**
 * SETUP TEST USER FOR DEMO LOGIN
 * Run: node setup-test-user.js (from backend folder)
 */

const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  userNICcardNumber: { type: String, required: true, unique: true },
  userContactNumber: { type: String, required: true },
  userEmail: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dpUrl: { type: String, required: true },
  role: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function setupTestUser() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');

    // Check if test user already exists
    const existingUser = await User.findOne({ userEmail: 'testuser@gym.com' });
    
    if (existingUser) {
      console.log('⚠️  Test user already exists');
      console.log('Email: testuser@gym.com');
      console.log('Password: test123\n');
      mongoose.disconnect();
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);

    // Create test user
    const testUser = new User({
      name: 'Demo User',
      age: 25,
      userNICcardNumber: 'TEST123456',
      userContactNumber: '0771234567',
      userEmail: 'testuser@gym.com',
      password: hashedPassword,
      dpUrl: 'https://via.placeholder.com/150',
      role: 'user'
    });

    await testUser.save();

    console.log('✅ TEST USER CREATED SUCCESSFULLY\n');
    console.log('📋 Test User Credentials:');
    console.log('   Email:    testuser@gym.com');
    console.log('   Password: test123');
    console.log('   Role:     Member (user)\n');
    console.log('🎯 Use the "🧪 Demo Login" button in the app to auto-login!');

    mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.disconnect();
    process.exit(1);
  }
}

setupTestUser();
