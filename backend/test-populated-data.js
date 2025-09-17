const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const PaymentRequest = require('./models/PaymentRequest');

async function testPopulatedData() {
  try {
    console.log('🔍 Testing populated payment request data...\n');
    
    // Find payment requests with populated data
    const paymentRequests = await PaymentRequest.find({ paymentType: 'winner_payment' })
      .populate('user', 'fullName email phone')
      .populate({
        path: 'auction',
        select: 'title auctionId auctionType startingPrice currency seller',
        populate: {
          path: 'seller',
          select: 'fullName email phone'
        }
      })
      .limit(1);
    
    if (paymentRequests.length > 0) {
      const request = paymentRequests[0];
      console.log('✅ Payment Request Found:');
      console.log('\n👤 Bidder (Payer):');
      console.log(`   Name: ${request.user.fullName}`);
      console.log(`   Email: ${request.user.email}`);
      console.log(`   Phone: ${request.user.phone || 'Not provided'}`);
      
      console.log('\n🏪 Auctioneer (Seller):');
      if (request.auction.seller) {
        console.log(`   Name: ${request.auction.seller.fullName}`);
        console.log(`   Email: ${request.auction.seller.email}`);
        console.log(`   Phone: ${request.auction.seller.phone || 'Not provided'}`);
      } else {
        console.log('   Seller information not populated');
      }
      
      console.log('\n🏷️ Auction Details:');
      console.log(`   Title: ${request.auction.title}`);
      console.log(`   ID: ${request.auction.auctionId}`);
      console.log(`   Type: ${request.auction.auctionType}`);
      console.log(`   Payment Amount: ${request.paymentAmount}`);
      console.log(`   Payment Type: ${request.paymentType}`);
      
    } else {
      console.log('❌ No winner payments found');
    }
    
  } catch (error) {
    console.error('❌ Error testing populated data:', error);
  } finally {
    mongoose.connection.close();
  }
}

testPopulatedData();