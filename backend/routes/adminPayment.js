const express = require('express');
const PaymentRequest = require('../models/PaymentRequest');
const Auction = require('../models/Auction');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Get all payment requests for admin review
router.get('/payment-requests', auth, adminAuth, async (req, res) => {
  try {
    const { status = 'all', paymentType = 'all', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    console.log('Admin Payment Requests Query:', { status, paymentType, page, limit });
    
    let filter = {};
    if (status !== 'all') {
      filter.verificationStatus = status;
    }

    // Add payment type filtering
    if (paymentType !== 'all') {
      if (paymentType === 'winner_payment') {
        filter.paymentType = 'winner_payment';
      } else if (paymentType === 'participation_fee') {
        filter.$or = [
          { paymentType: 'participation_fee' },
          { paymentType: { $exists: false } }
        ];
      }
    }
    
    console.log('MongoDB Filter:', filter);
    
    // Sort by priority: winner payments first, then by creation date
    const sortCriteria = {
      paymentType: -1, // winner_payment comes before participation_fee alphabetically 
      createdAt: -1 
    };
    
    const paymentRequests = await PaymentRequest.find(filter)
      .populate('user', 'fullName email phone')
      .populate({
        path: 'auction',
        select: 'title auctionId auctionType startingPrice currency seller',
        populate: {
          path: 'seller',
          select: 'fullName email phone'
        }
      })
      .populate('verifiedBy', 'fullName email')
      .sort(sortCriteria)
      .skip(skip)
      .limit(parseInt(limit));
    
    console.log(`Found ${paymentRequests.length} payment requests`);
    paymentRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.user?.fullName} - ${req.auction?.title} - Type: ${req.paymentType || 'participation_fee'} - Status: ${req.verificationStatus}`);
    });
    
    const total = await PaymentRequest.countDocuments(filter);
    
    // Get counts for different statuses
    const statusCounts = await PaymentRequest.aggregate([
      { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
    ]);
    
    // Get counts for different payment types
    const paymentTypeCounts = await PaymentRequest.aggregate([
      { 
        $group: { 
          _id: {
            $ifNull: ['$paymentType', 'participation_fee']
          }, 
          count: { $sum: 1 } 
        } 
      }
    ]);
    
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: total,
      winner_payments: 0,
      participation_fees: 0
    };
    
    statusCounts.forEach(item => {
      counts[item._id] = item.count;
    });
    
    paymentTypeCounts.forEach(item => {
      if (item._id === 'winner_payment') {
        counts.winner_payments = item.count;
      } else {
        counts.participation_fees = item.count;
      }
    });
    
    res.json({
      message: 'Payment requests retrieved successfully',
      paymentRequests,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        limit: parseInt(limit),
        totalRecords: total
      },
      counts
    });
    
  } catch (error) {
    console.error('Error getting payment requests:', error);
    res.status(500).json({ message: 'Error retrieving payment requests' });
  }
});

// Get payment requests for specific auction
router.get('/auction/:auctionId/payment-requests', auth, adminAuth, async (req, res) => {
  try {
    const { auctionId } = req.params;
    
    const paymentRequests = await PaymentRequest.find({ auction: auctionId })
      .populate('user', 'fullName email phone')
      .populate('verifiedBy', 'fullName email')
      .sort({ createdAt: -1 });
    
    const auction = await Auction.findById(auctionId).select('title auctionId auctionType');
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    res.json({
      message: 'Auction payment requests retrieved successfully',
      auction,
      paymentRequests
    });
    
  } catch (error) {
    console.error('Error getting auction payment requests:', error);
    res.status(500).json({ message: 'Error retrieving auction payment requests' });
  }
});

// Approve payment request
router.post('/payment-requests/:id/approve', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    const paymentRequest = await PaymentRequest.findById(id)
      .populate('user', 'fullName email')
      .populate('auction', 'title auctionId');
    
    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }
    
    if (paymentRequest.verificationStatus !== 'pending') {
      return res.status(400).json({ 
        message: 'Payment request has already been processed',
        currentStatus: paymentRequest.verificationStatus
      });
    }
    
    // Update payment request
    paymentRequest.verificationStatus = 'approved';
    paymentRequest.verifiedBy = req.user._id;
    paymentRequest.verifiedAt = new Date();
    paymentRequest.adminNotes = adminNotes || 'Payment approved by admin';
    paymentRequest.biddingEligibleFrom = new Date(); // User can bid immediately
    
    await paymentRequest.save();
    
    // You could send notification email/SMS to user here
    console.log(`Payment approved for user ${paymentRequest.user.fullName} for auction ${paymentRequest.auction.title}`);
    
    res.json({
      message: 'Payment request approved successfully',
      paymentRequest
    });
    
  } catch (error) {
    console.error('Error approving payment request:', error);
    res.status(500).json({ 
      message: 'Error approving payment request',
      error: error.message
    });
  }
});

// Reject payment request
router.post('/payment-requests/:id/reject', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    if (!adminNotes || adminNotes.trim().length === 0) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    const paymentRequest = await PaymentRequest.findById(id)
      .populate('user', 'fullName email')
      .populate('auction', 'title auctionId');
    
    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }
    
    if (paymentRequest.verificationStatus !== 'pending') {
      return res.status(400).json({ 
        message: 'Payment request has already been processed',
        currentStatus: paymentRequest.verificationStatus
      });
    }
    
    // Update payment request
    paymentRequest.verificationStatus = 'rejected';
    paymentRequest.verifiedBy = req.user._id;
    paymentRequest.verifiedAt = new Date();
    paymentRequest.adminNotes = adminNotes;
    
    await paymentRequest.save();
    
    // You could send notification email/SMS to user here
    console.log(`Payment rejected for user ${paymentRequest.user.fullName} for auction ${paymentRequest.auction.title}`);
    
    res.json({
      message: 'Payment request rejected successfully',
      paymentRequest
    });
    
  } catch (error) {
    console.error('Error rejecting payment request:', error);
    res.status(500).json({ 
      message: 'Error rejecting payment request',
      error: error.message
    });
  }
});

// Get payment request details by ID
router.get('/payment-requests/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const paymentRequest = await PaymentRequest.findById(id)
      .populate('user', 'fullName email phone')
      .populate({
        path: 'auction',
        select: 'title auctionId auctionType startingPrice currency seller',
        populate: {
          path: 'seller',
          select: 'fullName email phone'
        }
      })
      .populate('verifiedBy', 'fullName email');
    
    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }
    
    res.json({
      message: 'Payment request details retrieved successfully',
      paymentRequest
    });
    
  } catch (error) {
    console.error('Error getting payment request details:', error);
    res.status(500).json({ message: 'Error retrieving payment request details' });
  }
});

module.exports = router;