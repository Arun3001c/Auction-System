const mongoose = require('mongoose');
const PaymentRequest = require('./models/PaymentRequest');
const Auction = require('./models/Auction');
const User = require('./models/User');

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

const checkPayment = async () => {
  await connectDB();
  
  try {
    // Find the payment request for PREM KUMAR NAIK
    const paymentRequest = await PaymentRequest.findOne({ 
      paymentType: 'winner_payment' 
    })
    .populate('user', 'fullName email')
    .populate('auction', 'title auctionId minimumPrice startingPrice currency auctionType')
    .sort({ createdAt: -1 });
    
    if (!paymentRequest) {
      console.log('No winner payment request found');
      return;
    }
    
    console.log('\n=== CURRENT PAYMENT REQUEST DETAILS ===');
    console.log('User:', paymentRequest.user.fullName);
    console.log('User Email:', paymentRequest.user.email);
    console.log('Auction:', paymentRequest.auction.title);
    console.log('Auction ID:', paymentRequest.auction.auctionId);
    console.log('Auction Type:', paymentRequest.auction.auctionType);
    console.log('Minimum Price:', paymentRequest.auction.minimumPrice);
    console.log('Starting Price:', paymentRequest.auction.startingPrice);
    console.log('Currency:', paymentRequest.auction.currency);
    console.log('Current Payment Amount in DB:', paymentRequest.paymentAmount);
    console.log('Payment Type:', paymentRequest.paymentType);
    console.log('Status:', paymentRequest.verificationStatus);
    
    // Check the auction bids to see actual winning amount
    const auction = await Auction.findById(paymentRequest.auction._id);
    console.log('\n=== AUCTION BID DETAILS ===');
    console.log('Total Bids:', auction.bids?.length || 0);
    
    if (auction.bids && auction.bids.length > 0) {
      const highestBid = auction.bids.reduce((max, bid) => 
        bid.amount > max.amount ? bid : max, auction.bids[0]
      );
      console.log('Highest Bid Amount:', highestBid.amount);
      console.log('Minimum Price:', auction.minimumPrice);
      console.log('Expected Additional Amount:', highestBid.amount - auction.minimumPrice);
      console.log('Actual Payment Amount in DB:', paymentRequest.paymentAmount);
      
      const expectedAmount = highestBid.amount - auction.minimumPrice;
      if (paymentRequest.paymentAmount !== expectedAmount) {
        console.log('\n❌ PAYMENT AMOUNT MISMATCH DETECTED!');
        console.log('Expected:', expectedAmount);
        console.log('Current in DB:', paymentRequest.paymentAmount);
        console.log('Difference:', expectedAmount - paymentRequest.paymentAmount);
        
        // Offer to fix it
        console.log('\n🔧 Would you like to fix this? Update the payment amount in database...');
        
        // Update the payment amount
        paymentRequest.paymentAmount = expectedAmount;
        await paymentRequest.save();
        console.log('✅ Payment amount updated successfully!');
        console.log('New amount:', paymentRequest.paymentAmount);
      } else {
        console.log('\n✅ Payment amount is correct!');
      }
    }
    
  } catch (error) {
    console.error('Error checking payment:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkPayment();