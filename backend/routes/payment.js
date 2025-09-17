const express = require('express');
const PaymentRequest = require('../models/PaymentRequest');
const Auction = require('../models/Auction');
const Winner = require('../models/Winner');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

// Get admin payment details for joining reserve auction
router.get('/payment-details/:auctionId', auth, async (req, res) => {
  try {
    const { auctionId } = req.params;
    
    // Verify auction exists and is reserve type
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    if (auction.auctionType !== 'reserve') {
      return res.status(400).json({ message: 'Payment not required for this auction type' });
    }
    
    // Check if auction is active
    if (auction.status !== 'active' && auction.status !== 'upcoming') {
      return res.status(400).json({ message: 'Cannot join - auction is not active' });
    }
    
    // Check if user already has a payment request for this auction
    const existingRequest = await PaymentRequest.findOne({
      auction: auctionId,
      user: req.user._id,
      paymentType: 'participation_fee'
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        message: 'Payment request already exists',
        status: existingRequest.verificationStatus,
        paymentRequest: existingRequest
      });
    }
    
    // Calculate initial payment amount (could be percentage of starting price)
    const initialPaymentAmount = Math.max(auction.startingPrice * 0.1, 100); // 10% or minimum 100
    
    // Return admin payment details
    const paymentDetails = {
      auctionId: auction._id,
      auctionTitle: auction.title,
      initialPaymentAmount,
      currency: auction.currency,
      paymentMethods: {
        upi: {
          id: process.env.ADMIN_UPI_ID || 'admin@paytm',
          qrCode: process.env.ADMIN_UPI_QR || null,
          name: 'Auction System Admin'
        },
        bankTransfer: {
          accountNumber: process.env.ADMIN_ACCOUNT_NUMBER || '1234567890',
          ifsc: process.env.ADMIN_IFSC || 'BANK0001234',
          accountName: process.env.ADMIN_ACCOUNT_NAME || 'Auction System',
          bankName: process.env.ADMIN_BANK_NAME || 'Example Bank'
        }
      },
      instructions: [
        `Pay exactly ${initialPaymentAmount} ${auction.currency}`,
        'Take a clear screenshot of the payment confirmation',
        'Upload the screenshot using the form below',
        'Wait for admin verification before bidding'
      ]
    };
    
    res.json({
      message: 'Payment details retrieved successfully',
      paymentDetails
    });
    
  } catch (error) {
    console.error('Error getting payment details:', error);
    res.status(500).json({ message: 'Error retrieving payment details' });
  }
});

// Submit payment request with screenshot
router.post('/submit-payment', auth, upload.single('paymentScreenshot'), async (req, res) => {
  try {
    const { auctionId, paymentAmount, paymentMethod, transactionId, paymentDate } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Payment screenshot is required' });
    }
    
    // Verify auction exists and is reserve type
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    if (auction.auctionType !== 'reserve') {
      return res.status(400).json({ message: 'Payment not required for this auction type' });
    }
    
    // Check if user already has a payment request
    const existingRequest = await PaymentRequest.findOne({
      auction: auctionId,
      user: req.user._id,
      paymentType: 'participation_fee'
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        message: 'Payment request already exists',
        status: existingRequest.verificationStatus
      });
    }
    
    // Create payment request
    const paymentRequest = new PaymentRequest({
      auction: auctionId,
      user: req.user._id,
      paymentAmount: parseFloat(paymentAmount),
      paymentMethod: paymentMethod || 'UPI',
      paymentScreenshot: req.file.path, // Cloudinary URL
      transactionId: transactionId || '',
      paymentDate: new Date(paymentDate) || new Date(),
      verificationStatus: 'pending',
      paymentType: 'participation_fee' // Existing participation payment
    });
    
    await paymentRequest.save();
    
    // Populate user and auction details for response
    await paymentRequest.populate('user', 'fullName email');
    await paymentRequest.populate('auction', 'title auctionId');
    
    res.status(201).json({
      message: 'Payment request submitted successfully',
      paymentRequest,
      status: 'pending'
    });
    
  } catch (error) {
    console.error('Error submitting payment request:', error);
    res.status(500).json({ 
      message: 'Error submitting payment request',
      error: error.message
    });
  }
});

// Get user's payment requests
router.get('/my-payments', auth, async (req, res) => {
  try {
    const paymentRequests = await PaymentRequest.find({ user: req.user._id })
      .populate('auction', 'title auctionId auctionType status')
      .sort({ createdAt: -1 });
    
    res.json({
      message: 'Payment requests retrieved successfully',
      paymentRequests
    });
    
  } catch (error) {
    console.error('Error getting payment requests:', error);
    res.status(500).json({ message: 'Error retrieving payment requests' });
  }
});

// Check payment status for specific auction
router.get('/payment-status/:auctionId', auth, async (req, res) => {
  try {
    const { auctionId } = req.params;
    
    const paymentRequest = await PaymentRequest.findOne({
      auction: auctionId,
      user: req.user._id,
      paymentType: 'participation_fee'
    }).populate('auction', 'title auctionId');
    
    if (!paymentRequest) {
      return res.json({
        hasPayment: false,
        canBid: false,
        message: 'No payment request found for this auction'
      });
    }
    
    const canBid = paymentRequest.verificationStatus === 'approved';
    
    res.json({
      hasPayment: true,
      canBid,
      paymentRequest: {
        status: paymentRequest.verificationStatus,
        submittedAt: paymentRequest.createdAt,
        verifiedAt: paymentRequest.verifiedAt,
        adminNotes: paymentRequest.adminNotes
      }
    });
    
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ message: 'Error checking payment status' });
  }
});

// Get winner payment details for completing purchase
router.get('/winner-payment-details/:auctionId', auth, async (req, res) => {
  try {
    const { auctionId } = req.params;
    
    // Verify auction exists and is reserve type
    const auction = await Auction.findById(auctionId).populate('seller', 'fullName email');
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    if (auction.auctionType !== 'reserve') {
      return res.status(400).json({ message: 'Full payment not required for this auction type' });
    }
    
    // Check if auction has ended
    if (auction.status !== 'ended') {
      return res.status(400).json({ message: 'Auction has not ended yet' });
    }
    
    // Verify user is the winner
    const winner = await Winner.findOne({ auction: auctionId });
    
    console.log('Winner Payment Debug:', {
      auctionId,
      requestUserId: req.user._id,
      requestUserIdType: typeof req.user._id,
      winnerFound: !!winner,
      winnerUserId: winner?.user,
      winnerUserIdType: typeof winner?.user,
      comparison: winner ? String(winner.user) === String(req.user._id) : 'no winner',
      rawComparison: winner ? winner.user === req.user._id : 'no winner'
    });
    
    if (!winner || String(winner.user) !== String(req.user._id)) {
      console.log('❌ Winner validation failed');
      return res.status(403).json({ message: 'Only the auction winner can make this payment' });
    }
    
    console.log('✅ Winner validation passed');
    
    // Check if winner already has a payment request for this auction
    const existingRequest = await PaymentRequest.findOne({
      auction: auctionId,
      user: req.user._id,
      paymentType: 'winner_payment'
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        message: 'Winner payment request already exists',
        status: existingRequest.verificationStatus,
        paymentRequest: existingRequest
      });
    }
    
    // Return admin payment details for winner payment
    const paymentDetails = {
      auctionId: auction._id,
      auctionTitle: auction.title,
      winningAmount: winner.amount,
      currency: auction.currency,
      paymentMethods: {
        upi: {
          id: process.env.ADMIN_UPI_ID || 'admin@paytm',
          qrCode: process.env.ADMIN_UPI_QR || null,
          name: 'Auction System Admin'
        },
        bankTransfer: {
          accountNumber: process.env.ADMIN_ACCOUNT_NUMBER || '1234567890',
          ifsc: process.env.ADMIN_IFSC || 'BANK0001234',
          accountName: process.env.ADMIN_ACCOUNT_NAME || 'Auction System',
          bankName: process.env.ADMIN_BANK_NAME || 'Example Bank'
        }
      },
      instructions: [
        `Pay the full winning amount of ${winner.amount} ${auction.currency}`,
        'Take a clear screenshot of the payment confirmation',
        'Upload the screenshot using the form below',
        'Wait for admin verification to complete the purchase'
      ]
    };
    
    res.json({
      message: 'Winner payment details retrieved successfully',
      paymentDetails
    });
    
  } catch (error) {
    console.error('Error getting winner payment details:', error);
    res.status(500).json({ message: 'Error retrieving winner payment details' });
  }
});

// Submit winner payment request with screenshot
router.post('/submit-winner-payment', auth, upload.single('paymentScreenshot'), async (req, res) => {
  try {
    const { auctionId, winningAmount, paymentMethod, transactionId, paymentDate } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Payment screenshot is required' });
    }
    
    // Verify auction exists and is reserve type
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    if (auction.auctionType !== 'reserve') {
      return res.status(400).json({ message: 'Full payment not required for this auction type' });
    }
    
    // Check if auction has ended
    if (auction.status !== 'ended') {
      return res.status(400).json({ message: 'Auction has not ended yet' });
    }
    
    // Verify user is the winner
    const winner = await Winner.findOne({ auction: auctionId });
    
    console.log('Submit Winner Payment Debug:', {
      auctionId,
      requestUserId: req.user._id,
      requestUserIdType: typeof req.user._id,
      winnerFound: !!winner,
      winnerUserId: winner?.user,
      winnerUserIdType: typeof winner?.user,
      comparison: winner ? String(winner.user) === String(req.user._id) : 'no winner',
      rawComparison: winner ? winner.user === req.user._id : 'no winner'
    });
    
    if (!winner || String(winner.user) !== String(req.user._id)) {
      console.log('❌ Submit Winner payment validation failed');
      return res.status(403).json({ message: 'Only the auction winner can make this payment' });
    }
    
    console.log('✅ Submit Winner payment validation passed');
    
    // Check if user already has a winner payment request
    const existingRequest = await PaymentRequest.findOne({
      auction: auctionId,
      user: req.user._id,
      paymentType: 'winner_payment'
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        message: 'Winner payment request already exists',
        status: existingRequest.verificationStatus
      });
    }
    
    // Create winner payment request
    const paymentRequest = new PaymentRequest({
      auction: auctionId,
      user: req.user._id,
      paymentAmount: parseFloat(winningAmount),
      paymentMethod: paymentMethod || 'UPI',
      paymentScreenshot: req.file.path, // Cloudinary URL
      transactionId: transactionId || '',
      paymentDate: new Date(paymentDate) || new Date(),
      verificationStatus: 'pending',
      paymentType: 'winner_payment' // New field to distinguish winner payments
    });
    
    await paymentRequest.save();
    
    // Populate user and auction details for response
    await paymentRequest.populate('user', 'fullName email');
    await paymentRequest.populate('auction', 'title auctionId');
    
    res.status(201).json({
      message: 'Winner payment request submitted successfully',
      paymentRequest,
      status: 'pending'
    });
    
  } catch (error) {
    console.error('Error submitting winner payment request:', error);
    res.status(500).json({ 
      message: 'Error submitting winner payment request',
      error: error.message
    });
  }
});

// Check winner payment status for specific auction
router.get('/winner-payment-status/:auctionId', auth, async (req, res) => {
  try {
    const { auctionId } = req.params;
    
    const paymentRequest = await PaymentRequest.findOne({
      auction: auctionId,
      user: req.user._id,
      paymentType: 'winner_payment'
    }).populate('auction', 'title auctionId');
    
    if (!paymentRequest) {
      return res.json({
        hasPayment: false,
        message: 'No winner payment request found for this auction'
      });
    }
    
    res.json({
      hasPayment: true,
      paymentRequest: {
        status: paymentRequest.verificationStatus,
        submittedAt: paymentRequest.createdAt,
        verifiedAt: paymentRequest.verifiedAt,
        adminNotes: paymentRequest.adminNotes
      }
    });
    
  } catch (error) {
    console.error('Error checking winner payment status:', error);
    res.status(500).json({ message: 'Error checking winner payment status' });
  }
});

module.exports = router;