const mongoose = require('mongoose');
require('dotenv').config();

// Load all models
require('./models/User');
require('./models/Auction');
require('./models/PaymentRequest');

const PaymentRequest = mongoose.model('PaymentRequest');

async function checkPayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auction-db');
    console.log('Connected to database');
    
    const payments = await PaymentRequest.find().populate('user', 'name email phone').populate('auction', 'title');
    console.log('Total payment requests:', payments.length);
    
    if (payments.length > 0) {
      console.log('\nPayment requests:');
      payments.forEach((payment, index) => {
        console.log(`${index + 1}. User: ${payment.user?.name || 'Unknown'} | Auction: ${payment.auction?.title || 'Unknown'} | Status: ${payment.verificationStatus} | Amount: ${payment.paymentAmount}`);
      });
    } else {
      console.log('No payment requests found in database.');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkPayments();