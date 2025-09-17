const mongoose = require('mongoose');
const Auction = require('./models/Auction');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/auction_system')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function checkMinimumPrices() {
  try {
    const reserveAuctions = await Auction.find({ auctionType: 'reserve' });
    
    console.log('Reserve Auctions Found:', reserveAuctions.length);
    
    reserveAuctions.forEach((auction, index) => {
      console.log(`\nAuction ${index + 1}:`);
      console.log('- ID:', auction._id);
      console.log('- Title:', auction.title);
      console.log('- Starting Price:', auction.startingPrice);
      console.log('- Minimum Price:', auction.minimumPrice);
      console.log('- Current Bid:', auction.currentBid);
      console.log('- Reserved Amount:', auction.reservedAmount);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMinimumPrices();