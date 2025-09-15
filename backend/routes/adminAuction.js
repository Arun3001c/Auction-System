const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction');

// Get active auctions count
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

// Example admin auction route
router.get('/auctions', (req, res) => {
	res.json({ message: 'Admin auction route works!' });
});

module.exports = router;
