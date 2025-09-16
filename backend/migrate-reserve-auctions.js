const mongoose = require('mongoose');
const Auction = require('./models/Auction');
const AuctionRequest = require('./models/AuctionRequest');

async function migrateReserveAuctions() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/auction-system');
    console.log('Connected to MongoDB');
    
    // Find all reserve auctions that should be requests
    const reserveAuctions = await Auction.find({ 
      auctionType: 'reserve',
      $or: [
        { approvalStatus: 'pending' },
        { needsApproval: true },
        { status: 'pending' }
      ]
    }).populate('seller', 'fullName email');
    
    console.log(`Found ${reserveAuctions.length} reserve auctions to migrate`);
    
    if (reserveAuctions.length === 0) {
      console.log('No reserve auctions need migration');
      await mongoose.disconnect();
      return;
    }
    
    // Migrate each reserve auction to auction request
    for (const auction of reserveAuctions) {
      console.log(`\nMigrating auction: ${auction.title}`);
      
      // Check if auction request already exists
      const existingRequest = await AuctionRequest.findOne({ 
        auctionId: auction.auctionId 
      });
      
      if (existingRequest) {
        console.log('  - Auction request already exists, skipping');
        continue;
      }
      
      // Create auction request from auction data
      const auctionRequestData = {
        auctionId: auction.auctionId,
        title: auction.title,
        description: auction.description,
        category: auction.category,
        auctionType: auction.auctionType,
        images: auction.images,
        video: auction.video,
        startingPrice: auction.startingPrice,
        minimumPrice: auction.minimumPrice || auction.startingPrice,
        startDate: auction.startDate,
        endDate: auction.endDate,
        seller: auction.seller._id,
        currency: auction.currency,
        participationCode: auction.participationCode,
        certificates: auction.certificates || [],
        approvalStatus: 'pending',
        adminNotes: 'Migrated from existing reserve auction'
      };
      
      try {
        const auctionRequest = new AuctionRequest(auctionRequestData);
        await auctionRequest.save();
        console.log('  - Successfully created auction request');
        
        // Delete the original auction to avoid conflicts
        await Auction.deleteOne({ _id: auction._id });
        console.log('  - Original auction removed');
        
      } catch (error) {
        console.error(`  - Error migrating auction: ${error.message}`);
        if (error.code === 11000) {
          console.error('  - Duplicate key error - auction request may already exist');
        }
      }
    }
    
    console.log('\nMigration completed successfully');
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateReserveAuctions();
}

module.exports = migrateReserveAuctions;