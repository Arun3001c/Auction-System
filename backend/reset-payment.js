const mongoose = require('mongoose');
require('dotenv').config();

async function checkCurrentPayment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const PaymentRequest = require('./models/PaymentRequest');
    
    // Find all payment requests for this auction
    const paymentRequests = await PaymentRequest.find({
      auction: new mongoose.Types.ObjectId('68caac3ada70908a8d88ca38'),
      user: new mongoose.Types.ObjectId('68caa8cada70908a8d88c6d2')
    });
    
    console.log(`Found ${paymentRequests.length} payment request(s):`);
    paymentRequests.forEach((req, index) => {
      console.log(`${index + 1}. Type: ${req.paymentType}, Amount: ${req.paymentAmount}, Status: ${req.verificationStatus}, ID: ${req._id}`);
      console.log(`   Screenshot: ${req.paymentScreenshot ? 'Yes' : 'No'}`);
      console.log(`   Transaction ID: ${req.transactionId || 'None'}`);
      console.log(`   Created: ${req.createdAt}`);
      console.log('---');
    });
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCurrentPayment();