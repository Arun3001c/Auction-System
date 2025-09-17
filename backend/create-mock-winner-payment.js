const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const PaymentRequest = require('./models/PaymentRequest');
const User = require('./models/User');
const Auction = require('./models/Auction');

async function createMockWinnerPayment() {
  try {
    console.log('🔄 Creating mock winner payment...\n');
    
    // Find a reserve auction
    const reserveAuction = await Auction.findOne({ auctionType: 'reserve' });
    if (!reserveAuction) {
      console.log('❌ No reserve auction found');
      return;
    }
    
    // Find a user
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No user found');
      return;
    }
    
    // Create a mock winner payment request
    const mockPayment = new PaymentRequest({
      auction: reserveAuction._id,
      user: user._id,
      paymentAmount: 50000, // Mock winning amount
      paymentMethod: 'UPI',
      paymentScreenshot: 'https://res.cloudinary.com/dhjbphutc/image/upload/v1755457818/no-image-found_kgenoc.png',
      transactionId: 'TXN123456789',
      paymentDate: new Date(),
      verificationStatus: 'pending',
      paymentType: 'winner_payment' // This is the key field!
    });
    
    await mockPayment.save();
    
    console.log('✅ Mock winner payment created successfully!');
    console.log(`   User: ${user.fullName}`);
    console.log(`   Auction: ${reserveAuction.title}`);
    console.log(`   Amount: ₹${mockPayment.paymentAmount}`);
    console.log(`   Type: ${mockPayment.paymentType}`);
    console.log(`   Status: ${mockPayment.verificationStatus}`);
    
  } catch (error) {
    console.error('❌ Error creating mock winner payment:', error);
  } finally {
    mongoose.connection.close();
  }
}

createMockWinnerPayment();