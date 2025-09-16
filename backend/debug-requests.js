const mongoose = require('mongoose');
require('dotenv').config();

const AuctionRequest = require('./models/AuctionRequest');
const Auction = require('./models/Auction');

async function debugRequests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auction_system');
    console.log('Connected to MongoDB');

    // Get all auction requests
    const requests = await AuctionRequest.find({}).sort({ createdAt: -1 }).limit(5);
    console.log('\n=== Auction Requests ===');
    requests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.title}`);
      console.log(`   Status: ${req.status}`);
      console.log(`   Approval Status: ${req.approvalStatus}`);
      console.log(`   ID: ${req._id}`);
      console.log(`   Seller: ${req.seller}`);
      console.log(`   AuctionId: ${req.auctionId}`);
      console.log(`   ParticipationCode: ${req.participationCode}`);
      console.log(`   Start Date: ${req.startDate}`);
      console.log(`   End Date: ${req.endDate}`);
      console.log(`   Images: ${req.images?.length || 0}`);
      console.log(`   Certificates: ${req.certificates?.length || 0}`);
      console.log(`   Created Auction: ${req.createdAuction}`);
      console.log('   ---');
    });

    // Check for any auctions with same auctionId or participationCode
    const pendingRequests = requests.filter(req => req.approvalStatus === 'pending');
    for (const req of pendingRequests) {
      console.log(`\n=== Checking conflicts for: ${req.title} ===`);
      const conflictingAuctions = await Auction.find({
        $or: [
          { auctionId: req.auctionId },
          { participationCode: req.participationCode }
        ]
      });
      
      if (conflictingAuctions.length > 0) {
        console.log('Found conflicting auctions:');
        conflictingAuctions.forEach(auction => {
          console.log(`  - ${auction.title} (ID: ${auction._id})`);
          console.log(`    AuctionId: ${auction.auctionId}`);
          console.log(`    ParticipationCode: ${auction.participationCode}`);
        });
      } else {
        console.log('No conflicting auctions found - should be safe to approve');
      }
    }

    await mongoose.disconnect();
    console.log('\nDebug complete');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugRequests();