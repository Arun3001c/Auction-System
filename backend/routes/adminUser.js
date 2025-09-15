const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get users count
router.get('/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error getting users count:', error);
    res.status(500).json({ message: 'Error fetching users count', error: error.message });
  }
});

// Example admin user route
router.get('/users', (req, res) => {
	res.json({ message: 'Admin user route works!' });
});

module.exports = router;
