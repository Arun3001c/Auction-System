const mongoose = require('mongoose');
require('dotenv').config();

// Load all models
require('./models/User');
require('./models/Admin');

const User = mongoose.model('User');
const Admin = mongoose.model('Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function createTestAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auction-db');
    console.log('Connected to database');
    
    // Check if admin already exists
    let admin = await Admin.findOne({ email: 'admin@test.com' });
    
    if (!admin) {
      // Create admin
      const hashedPassword = await bcrypt.hash('admin123', 12);
      admin = new Admin({
        email: 'admin@test.com',
        password: hashedPassword,
        phone: '+1234567890'
      });
      await admin.save();
      console.log('Test admin created');
    } else {
      console.log('Test admin already exists');
    }
    
    // Generate token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('Admin Token:', token);
    console.log('\nYou can use this token to test the admin API endpoints');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createTestAdmin();