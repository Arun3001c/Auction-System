const mongoose = require('mongoose');

const paymentRequestSchema = new mongoose.Schema({
  // Reference to the auction this payment is for
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true
  },
  
  // User making the payment request
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Payment details
  paymentAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Payment method (UPI, Bank Transfer, etc.)
  paymentMethod: {
    type: String,
    required: true,
    enum: ['UPI', 'Bank Transfer', 'Other'],
    default: 'UPI'
  },
  
  // Screenshot of payment proof
  paymentScreenshot: {
    type: String,
    required: true
  },
  
  // Payment reference details provided by user
  transactionId: {
    type: String,
    trim: true
  },
  
  paymentDate: {
    type: Date,
    required: true
  },
  
  // Type of payment: participation fee or winner payment
  paymentType: {
    type: String,
    enum: ['participation_fee', 'winner_payment'],
    default: 'participation_fee'
  },
  
  // Admin verification
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Admin who verified the payment
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  verifiedAt: {
    type: Date,
    default: null
  },
  
  // Admin notes for verification decision
  adminNotes: {
    type: String,
    trim: true
  },
  
  // When user can start bidding (for approved payments)
  biddingEligibleFrom: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index to ensure one payment request per user per auction per payment type
paymentRequestSchema.index({ auction: 1, user: 1, paymentType: 1 }, { unique: true });

// Index for admin to quickly find pending requests
paymentRequestSchema.index({ verificationStatus: 1, createdAt: -1 });

// Index for auction-specific payment requests
paymentRequestSchema.index({ auction: 1, verificationStatus: 1 });

// Index for payment type filtering
paymentRequestSchema.index({ paymentType: 1, verificationStatus: 1 });

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema);