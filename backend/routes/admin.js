const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Auction = require('../models/Auction');

// GET /api/admin/users/count - Get total users count
router.get('/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error getting users count:', error);
    res.status(500).json({ message: 'Error fetching users count', error: error.message });
  }
});

// GET /api/admin/auctions/active-count - Get active auctions count
router.get('/auctions/active-count', async (req, res) => {
  try {
    const currentTime = new Date();
    const count = await Auction.countDocuments({
      $and: [
        { startTime: { $lte: currentTime } },
        { endTime: { $gt: currentTime } },
        { status: { $ne: 'ended' } }
      ]
    });
    res.json({ count });
  } catch (error) {
    console.error('Error getting active auctions count:', error);
    res.status(500).json({ message: 'Error fetching active auctions count', error: error.message });
  }
});

// PUT /api/admin/users/:id/suspend
router.put('/users/:id/suspend', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.suspended = true;
  await user.save();
  res.json({ message: 'User suspended' });
});

// PUT /api/admin/users/:id/unsuspend
router.put('/users/:id/unsuspend', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.suspended = false;
  await user.save();
  res.json({ message: 'User unsuspended' });
});

// GET /api/admin/users?search=&page=1&pageSize=10
router.get('/users', async (req, res) => {
  const { search = '', page = 1, pageSize = 10 } = req.query;
  const query = search
    ? {
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }
    : {};
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .skip((page - 1) * pageSize)
    .limit(Number(pageSize));
  res.json({ users, total });
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  console.log('PUT /api/admin/users/:id called', req.params.id, req.body);
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update user fields
    const { fullName, email, phoneNumber, role, password, isEmailVerified, isPhoneVerified } = req.body;
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (role) user.role = role;
    if (typeof isEmailVerified === 'boolean') user.isEmailVerified = isEmailVerified;
    if (typeof isPhoneVerified === 'boolean') user.isPhoneVerified = isPhoneVerified;
    if (password) user.password = password; // Ensure password hashing is handled in the User model

    await user.save();
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
