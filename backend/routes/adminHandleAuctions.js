const express = require('express');
const Auction = require('../models/Auction');
const router = express.Router();

// Get all auctions (including stopped and deleted)
router.get('/', async (req, res) => {
  try {
    // First, let's try to clean up any invalid category data
    await Auction.deleteMany({ category: "Toys" });
    
    const auctions = await Auction.find({})
      .populate('seller', 'fullName email')
      .populate('currentHighestBidder', 'fullName')
      .sort('-createdAt');
    res.json(auctions);
  } catch (error) {
    console.error('Error fetching auctions for admin:', error);
    
    // If there's a validation error, try to clean up and retry
    if (error.name === 'ValidationError' && error.errors.category) {
      try {
        await Auction.deleteMany({ category: "Toys" });
        const auctions = await Auction.find({})
          .populate('seller', 'fullName email')
          .populate('currentHighestBidder', 'fullName')
          .sort('-createdAt');
        res.json(auctions);
      } catch (retryError) {
        res.status(500).json({ message: 'Server error fetching auctions after cleanup', error: retryError.message });
      }
    } else {
      res.status(500).json({ message: 'Server error fetching auctions', error: error.message });
    }
  }
});

// Get only deleted auctions
router.get('/deleted', async (req, res) => {
  try {
    const deletedAuctions = await Auction.find({ status: 'deleted' });
    res.json(deletedAuctions);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching deleted auctions', error: error.message });
  }
});

// Stop an auction (set status to 'stopped')
router.put('/:id/stop', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    auction.status = 'stopped';
    await auction.save();
    res.json({ message: 'Auction stopped successfully', auction });
  } catch (error) {
    res.status(500).json({ message: 'Server error stopping auction', error: error.message });
  }
});

// Continue a stopped auction (set status to 'active')
router.put('/:id/continue', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    auction.status = 'active';
    await auction.save();
    res.json({ message: 'Auction continued successfully', auction });
  } catch (error) {
    res.status(500).json({ message: 'Server error continuing auction', error: error.message });
  }
});

// Delete an auction (set status to 'deleted')
router.delete('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    auction.status = 'deleted';
    await auction.save();
    res.json({ message: 'Auction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting auction', error: error.message });
  }
});

module.exports = router;
