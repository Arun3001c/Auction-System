const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const PaymentRequest = require('./models/PaymentRequest');
const Winner = require('./models/Winner');
const Auction = require('./models/Auction');

async function checkWinnerPayments() {
  try {
    console.log('🔍 Checking winner payment data...\n');
    
    // Count winner payments
    const winnerPayments = await PaymentRequest.find({ paymentType: 'winner_payment' })
      .populate('user', 'fullName email')
      .populate('auction', 'title auctionId auctionType');
    
    console.log(`🏆 Winner Payments Found: ${winnerPayments.length}`);
    
    if (winnerPayments.length > 0) {
      console.log('\n📋 Winner Payment Details:');
      winnerPayments.forEach((payment, index) => {
        console.log(`${index + 1}. ${payment.user.fullName} - ${payment.auction.title}`);
        console.log(`   Amount: ${payment.paymentAmount} | Status: ${payment.verificationStatus}`);
        console.log(`   Date: ${new Date(payment.createdAt).toLocaleDateString()}\n`);
      });
    }
    
    // Check reserve auctions
    const reserveAuctions = await Auction.find({ auctionType: 'reserve', status: 'ended' });
    console.log(`\n🏛️ Ended Reserve Auctions: ${reserveAuctions.length}`);
    
    // Check winners of reserve auctions
    const reserveWinners = await Winner.find({
      auction: { $in: reserveAuctions.map(a => a._id) }
    }).populate('user', 'fullName email')
      .populate('auction', 'title auctionId auctionType');
    
    console.log(`\n🎯 Reserve Auction Winners: ${reserveWinners.length}`);
    
    if (reserveWinners.length > 0) {
      console.log('\n📋 Reserve Auction Winners:');
      reserveWinners.forEach((winner, index) => {
        console.log(`${index + 1}. ${winner.user.fullName} won ${winner.auction.title}`);
        console.log(`   Winning Amount: ${winner.winningAmount}`);
        console.log(`   User ID: ${winner.user._id}`);
        console.log(`   Auction Type: ${winner.auction.auctionType}\n`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking winner payment data:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkWinnerPayments();