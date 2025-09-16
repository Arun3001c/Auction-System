const mongoose = require('mongoose');

const auctionRequestSchema = new mongoose.Schema({
  // Basic auction data (same as Auction model but for approval)
  auctionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Fashion', 'Home & Garden', 'Collectibles', 'Art', 'Books', 'Music', 'Jewelry', 'Vehicles', 'Automotive', 'Sports', 'Other']
  },
  auctionType: {
    type: String,
    required: true,
    enum: ['reserve'], // Only for reserve auctions
    default: 'reserve'
  },
  images: [{
    type: String,
    required: true
  }],
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF', 'SGD', 'NZD', 'ZAR', 'BRL', 'RUB', 'KRW', 'HKD', 'MXN', 'SEK', 'NOK', 'TRY', 'SAR', 'AED', 'PLN', 'THB', 'IDR', 'MYR', 'PHP', 'VND', 'EGP', 'PKR', 'BDT', 'Other'],
    default: 'USD'
  },
  video: {
    type: String,
    default: null
  },
  startingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  minimumPrice: {
    type: Number,
    required: false,
    min: 0,
    default: null
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participationCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Certificate verification fields
  certificates: [{
    type: String,
    required: true
  }],
  
  // Approval workflow fields
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  adminNotes: {
    type: String,
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  
  // Reference to created auction (when approved)
  createdAuction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuctionRequest', auctionRequestSchema);