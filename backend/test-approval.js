const mongoose = require('mongoose');
require('dotenv').config();

const AuctionRequest = require('./models/AuctionRequest');
const Auction = require('./models/Auction');
const User = require('./models/User');

async function testApproval() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auction_system');
    console.log('Connected to MongoDB');

    // Find a pending request without conflicts
    const pendingRequest = await AuctionRequest.findOne({
      approvalStatus: 'pending',
      title: 'tset for the reserve' // We know this one should be safe
    });

    if (!pendingRequest) {
      console.log('No suitable pending request found');
      return;
    }

    console.log(`\n=== Testing approval for: ${pendingRequest.title} ===`);
    console.log(`ID: ${pendingRequest._id}`);
    console.log(`AuctionId: ${pendingRequest.auctionId}`);
    console.log(`ParticipationCode: ${pendingRequest.participationCode}`);

    // Check for conflicts (same logic as in the API)
    const existingAuction = await Auction.findOne({
      $or: [
        { auctionId: pendingRequest.auctionId },
        { participationCode: pendingRequest.participationCode }
      ],
      status: { $ne: 'deleted' }
    });

    if (existingAuction) {
      console.log('❌ Conflict found - approval would fail');
      console.log(`Conflicting auction: ${existingAuction.title} (${existingAuction.status})`);
    } else {
      console.log('✅ No conflicts found - approval should succeed');
      
      // Simulate creating the auction
      const auctionData = {
        auctionId: pendingRequest.auctionId,
        title: pendingRequest.title,
        description: pendingRequest.description,
        category: pendingRequest.category,
        auctionType: pendingRequest.auctionType,
        images: pendingRequest.images,
        video: pendingRequest.video,
        startingPrice: pendingRequest.startingPrice,
        reservePrice: pendingRequest.reservePrice,
        minimumPrice: pendingRequest.minimumPrice,
        startDate: pendingRequest.startDate,
        endDate: pendingRequest.endDate,
        seller: pendingRequest.seller,
        currency: pendingRequest.currency,
        participationCode: pendingRequest.participationCode,
        certificates: pendingRequest.certificates || [],
        needsApproval: false,
        approvalStatus: 'approved'
      };

      console.log('\n📝 Would create auction with data:');
      console.log(`- Title: ${auctionData.title}`);
      console.log(`- Seller: ${auctionData.seller}`);
      console.log(`- Start: ${auctionData.startDate}`);
      console.log(`- End: ${auctionData.endDate}`);
      console.log(`- Starting Price: ${auctionData.startingPrice}`);
      console.log(`- Images: ${auctionData.images?.length || 0}`);
      console.log(`- Certificates: ${auctionData.certificates?.length || 0}`);
    }

    await mongoose.disconnect();
    console.log('\nTest complete');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testApproval();