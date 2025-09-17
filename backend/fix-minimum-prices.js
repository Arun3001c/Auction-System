const mongoose = require('mongoose');
const Auction = require('./models/Auction');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/auction_system')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Update reserve auctions that don't have minimumPrice set
    const result = await Auction.updateMany(
      { 
        auctionType: 'reserve',
        $or: [
          { minimumPrice: null },
          { minimumPrice: { $exists: false } }
        ]
      },
      { 
        $set: { 
          minimumPrice: function() {
            return this.startingPrice || 100;
          }
        }
      }
    );
    
    console.log('Updated auctions:', result.modifiedCount);
    
    // Alternative approach - find and update each individually
    const auctionsToUpdate = await Auction.find({
      auctionType: 'reserve',
      $or: [
        { minimumPrice: null },
        { minimumPrice: { $exists: false } }
      ]
    });
    
    console.log('Found auctions needing update:', auctionsToUpdate.length);
    
    for (let auction of auctionsToUpdate) {
      auction.minimumPrice = auction.startingPrice || 100;
      await auction.save();
      console.log(`Updated auction ${auction._id} - minimumPrice set to ${auction.minimumPrice}`);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });