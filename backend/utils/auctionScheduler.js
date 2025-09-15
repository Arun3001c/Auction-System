const Auction = require('../models/Auction');
const Winner = require('../models/Winner');
const User = require('../models/User');
const winnerController = require('../controllers/winnerController');

// Process ended auctions and notify winners
const processEndedAuctions = async () => {
  try {
    console.log('=== Checking for ended auctions ===');
    console.log('Current time:', new Date().toISOString());
    
    // Find all auctions that have ended but status is still 'active'
    const now = new Date();
    const endedAuctions = await Auction.find({
      endDate: { $lte: now },
      status: 'active'
    }).populate('currentHighestBidder').populate('seller');

    console.log(`Found ${endedAuctions.length} ended auction(s) to process.`);

    if (endedAuctions.length === 0) {
      console.log('No ended auctions to process.');
      return;
    }

    for (const auction of endedAuctions) {
      try {
        console.log(`\n--- Processing auction: ${auction.title} ---`);
        console.log(`End Date: ${auction.endDate}`);
        console.log(`Current Highest Bidder: ${auction.currentHighestBidder ? auction.currentHighestBidder.fullName : 'None'}`);
        
        // Update auction status to ended
        auction.status = 'ended';
        await auction.save();
        
        console.log(`✅ Auction "${auction.title}" status updated to ended.`);

        // Process winner if there's a highest bidder
        if (auction.currentHighestBidder) {
          // Check if winner already exists
          const existingWinner = await Winner.findOne({ auction: auction._id });
          
          if (!existingWinner) {
            console.log(`Creating winner record for ${auction.currentHighestBidder.fullName}...`);
            
            // Create winner record
            const winner = await Winner.create({
              auction: auction._id,
              user: auction.currentHighestBidder._id,
              fullName: auction.currentHighestBidder.fullName,
              email: auction.currentHighestBidder.email,
              phone: auction.currentHighestBidder.phoneNumber,
              amount: auction.currentBid,
              notified: false
            });

            console.log(`✅ Winner record created for auction: ${auction.title}`);

            // Send winner notification email
            try {
              console.log(`📧 Sending winner notification email to: ${auction.currentHighestBidder.email}`);
              
              const emailResult = await winnerController.sendWinnerNotification({
                winnerId: winner._id,
                fullName: auction.currentHighestBidder.fullName,
                email: auction.currentHighestBidder.email,
                phone: auction.currentHighestBidder.phoneNumber,
                amount: auction.currentBid,
                currency: auction.currency,
                auctionTitle: auction.title,
                auctionId: auction.auctionId
              });
              
              if (emailResult && emailResult.success !== false) {
                console.log(`✅ Winner notification sent successfully to ${auction.currentHighestBidder.email} for auction: ${auction.title}`);
              } else {
                console.error(`❌ Failed to send winner notification - Email result:`, emailResult);
              }
            } catch (emailError) {
              console.error(`❌ Failed to send winner notification for auction ${auction.title}:`, emailError);
            }
          } else {
            console.log(`ℹ️ Winner already processed for auction: ${auction.title}`);
          }
        } else {
          console.log(`ℹ️ No bids found for auction: ${auction.title}`);
        }
      } catch (auctionError) {
        console.error(`❌ Error processing auction ${auction.title}:`, auctionError);
      }
    }
    
    console.log('=== Finished processing ended auctions ===\n');
  } catch (error) {
    console.error('❌ Error in processEndedAuctions:', error);
  }
};

// Start auction scheduler - runs every 5 minutes
const startAuctionScheduler = () => {
  console.log('Starting auction scheduler...');
  
  // Run immediately on startup
  processEndedAuctions();
  
  // Then run every 5 minutes
  const interval = setInterval(processEndedAuctions, 5 * 60 * 1000); // 5 minutes
  
  return interval;
};

// Stop auction scheduler
const stopAuctionScheduler = (interval) => {
  if (interval) {
    clearInterval(interval);
    console.log('Auction scheduler stopped.');
  }
};

module.exports = {
  processEndedAuctions,
  startAuctionScheduler,
  stopAuctionScheduler
};
