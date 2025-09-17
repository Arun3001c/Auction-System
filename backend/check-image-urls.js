const mongoose = require('mongoose');
const PaymentRequest = require('./models/PaymentRequest');
const User = require('./models/User');
const Auction = require('./models/Auction');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://Auction:Auction@cluster0.gigrd8m.mongodb.net/auction-system?retryWrites=true&w=majority');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkImageUrls = async () => {
  await connectDB();
  
  try {
    const paymentRequest = await PaymentRequest.findOne({ 
      paymentType: 'winner_payment' 
    })
    .populate('user', 'fullName email')
    .populate('auction', 'title')
    .sort({ createdAt: -1 });
    
    if (!paymentRequest) {
      console.log('No payment request found');
      return;
    }
    
    console.log('\n=== PAYMENT SCREENSHOT URL DEBUG ===');
    console.log('User:', paymentRequest.user.fullName);
    console.log('Auction:', paymentRequest.auction.title);
    console.log('Payment Screenshot URL:', paymentRequest.paymentScreenshot);
    console.log('URL Type:', typeof paymentRequest.paymentScreenshot);
    console.log('URL Length:', paymentRequest.paymentScreenshot?.length || 0);
    
    // Check if it's a Cloudinary URL or local path
    if (paymentRequest.paymentScreenshot) {
      if (paymentRequest.paymentScreenshot.startsWith('http')) {
        console.log('✅ URL Format: External URL (Cloudinary/CDN)');
      } else if (paymentRequest.paymentScreenshot.startsWith('uploads/')) {
        console.log('⚠️ URL Format: Local file path - needs server prefix');
        console.log('Suggested URL: http://localhost:5001/' + paymentRequest.paymentScreenshot);
      } else {
        console.log('❓ URL Format: Unknown format');
      }
    } else {
      console.log('❌ No screenshot URL found');
    }
    
  } catch (error) {
    console.error('Error checking image URLs:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkImageUrls();