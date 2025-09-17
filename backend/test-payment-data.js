const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const PaymentRequest = require('./models/PaymentRequest');

async function checkPaymentData() {
  try {
    console.log('🔍 Checking payment request data...\n');
    
    // Count total payment requests
    const totalCount = await PaymentRequest.countDocuments();
    console.log(`📊 Total payment requests: ${totalCount}`);
    
    // Count by status
    const pendingCount = await PaymentRequest.countDocuments({ verificationStatus: 'pending' });
    const approvedCount = await PaymentRequest.countDocuments({ verificationStatus: 'approved' });
    const rejectedCount = await PaymentRequest.countDocuments({ verificationStatus: 'rejected' });
    
    console.log(`⏳ Pending: ${pendingCount}`);
    console.log(`✅ Approved: ${approvedCount}`);
    console.log(`❌ Rejected: ${rejectedCount}`);
    
    // Count by payment type
    const winnerPayments = await PaymentRequest.countDocuments({ paymentType: 'winner_payment' });
    const participationFees = await PaymentRequest.countDocuments({ 
      $or: [
        { paymentType: 'participation_fee' },
        { paymentType: { $exists: false } }
      ]
    });
    
    console.log(`\n💰 Payment Types:`);
    console.log(`🏆 Winner Payments: ${winnerPayments}`);
    console.log(`🎯 Participation Fees: ${participationFees}`);
    
    // Show recent requests
    const recentRequests = await PaymentRequest.find()
      .populate('user', 'fullName email')
      .populate('auction', 'title auctionId')
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log(`\n📋 Recent Payment Requests:`);
    recentRequests.forEach((request, index) => {
      const paymentType = request.paymentType === 'winner_payment' ? '🏆 Winner Payment' : '🎯 Participation Fee';
      console.log(`${index + 1}. ${request.user.fullName} - ${request.auction.title}`);
      console.log(`   Type: ${paymentType} | Status: ${request.verificationStatus} | Amount: ${request.paymentAmount}`);
      console.log(`   Date: ${new Date(request.createdAt).toLocaleDateString()}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error checking payment data:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkPaymentData();