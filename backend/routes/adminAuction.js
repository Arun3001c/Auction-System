const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction');
const AuctionRequest = require('../models/AuctionRequest');

// Get active auctions count
router.get('/auctions/active-count', async (req, res) => {
  try {
    const currentTime = new Date();
    const count = await Auction.countDocuments({
      $and: [
        { startTime: { $lte: currentTime } },
        { endTime: { $gt: currentTime } },
        { status: { $ne: 'ended' } }
      ]
    });
    res.json({ count });
  } catch (error) {
    console.error('Error getting active auctions count:', error);
    res.status(500).json({ message: 'Error fetching active auctions count', error: error.message });
  }
});

// Get all pending auction requests
router.get('/auction-requests', async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status && status !== 'all') {
      filter.approvalStatus = status;
    }

    const requests = await AuctionRequest.find(filter)
      .populate('seller', 'fullName email phoneNumber')
      .sort('-submittedAt')
      .skip(skip)
      .limit(limitNum);

    // Debug: Log images vs certificates for each request
    console.log('Auction Requests Debug:');
    requests.forEach((req, index) => {
      console.log(`Request ${index + 1}: ${req.title}`);
      console.log(`  Images: ${req.images?.length || 0} items`);
      console.log(`  Certificates: ${req.certificates?.length || 0} items`);
      if (req.images?.length) {
        console.log(`  First image: ${req.images[0]?.substring(0, 50)}...`);
      }
      if (req.certificates?.length) {
        console.log(`  First certificate: ${req.certificates[0]?.substring(0, 50)}...`);
      }
    });

    const total = await AuctionRequest.countDocuments(filter);

    res.json({
      requests,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching auction requests:', error);
    res.status(500).json({ message: 'Error fetching auction requests', error: error.message });
  }
});

// Get single auction request by ID
router.get('/auction-requests/:id', async (req, res) => {
  try {
    const request = await AuctionRequest.findById(req.params.id)
      .populate('seller', 'fullName email phoneNumber')
      .populate('reviewedBy', 'fullName email');

    if (!request) {
      return res.status(404).json({ message: 'Auction request not found' });
    }

    // Debug: Log what's actually in the database
    console.log('Auction Request Debug:');
    console.log('Images:', request.images);
    console.log('Certificates:', request.certificates);
    console.log('Images length:', request.images?.length);
    console.log('Certificates length:', request.certificates?.length);

    res.json(request);
  } catch (error) {
    console.error('Error fetching auction request:', error);
    res.status(500).json({ message: 'Error fetching auction request', error: error.message });
  }
});

// Approve auction request
router.post('/auction-requests/:id/approve', async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const requestId = req.params.id;

    console.log('Approving auction request:', requestId);

    const auctionRequest = await AuctionRequest.findById(requestId);
    if (!auctionRequest) {
      return res.status(404).json({ message: 'Auction request not found' });
    }

    if (auctionRequest.approvalStatus !== 'pending') {
      if (auctionRequest.approvalStatus === 'approved') {
        return res.status(400).json({ 
          message: 'This auction request has already been approved',
          existingAuction: auctionRequest.createdAuction
        });
      } else {
        return res.status(400).json({ 
          message: `Auction request is ${auctionRequest.approvalStatus}` 
        });
      }
    }

    console.log('Found auction request:', auctionRequest.title);

    // Validate required fields before creating auction
    const requiredFields = ['auctionId', 'title', 'description', 'category', 'auctionType', 'images', 'startingPrice', 'startDate', 'endDate', 'seller', 'currency', 'participationCode'];
    const missingFields = requiredFields.filter(field => !auctionRequest[field] || (Array.isArray(auctionRequest[field]) && auctionRequest[field].length === 0));
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({ 
        message: 'Auction request is missing required fields',
        missingFields 
      });
    }

    console.log('All required fields present, proceeding with auction creation...');
    console.log('Creating auction with data...');

    // Validate required fields from auction request
    if (!auctionRequest.auctionId || !auctionRequest.title || !auctionRequest.participationCode) {
      return res.status(400).json({ 
        message: 'Missing required fields in auction request',
        missing: {
          auctionId: !auctionRequest.auctionId,
          title: !auctionRequest.title,
          participationCode: !auctionRequest.participationCode
        }
      });
    }

    // Check if auction with same auctionId or participationCode already exists
    // But exclude auctions that were already created from this request
    const existingAuction = await Auction.findOne({
      $or: [
        { auctionId: auctionRequest.auctionId },
        { participationCode: auctionRequest.participationCode }
      ]
    });

    if (existingAuction) {
      // Check if this auction was already created from this request
      if (auctionRequest.createdAuction && auctionRequest.createdAuction.toString() === existingAuction._id.toString()) {
        return res.status(400).json({ 
          message: 'This auction request has already been approved and auction created'
        });
      } else {
        return res.status(400).json({ 
          message: 'Another auction with this ID or participation code already exists',
          conflict: {
            auctionId: existingAuction.auctionId === auctionRequest.auctionId,
            participationCode: existingAuction.participationCode === auctionRequest.participationCode
          }
        });
      }
    }

    // Create the actual auction from the request
    const auctionData = {
      auctionId: auctionRequest.auctionId,
      title: auctionRequest.title,
      description: auctionRequest.description,
      category: auctionRequest.category,
      auctionType: auctionRequest.auctionType,
      images: auctionRequest.images,
      video: auctionRequest.video,
      startingPrice: auctionRequest.startingPrice,
      reservePrice: auctionRequest.reservePrice,
      minimumPrice: auctionRequest.minimumPrice,
      startDate: auctionRequest.startDate,
      endDate: auctionRequest.endDate,
      seller: auctionRequest.seller,
      currency: auctionRequest.currency,
      participationCode: auctionRequest.participationCode,
      certificates: auctionRequest.certificates || [],
      needsApproval: false,
      approvalStatus: 'approved'
    };

    console.log('Auction data prepared:', {
      auctionId: auctionData.auctionId,
      title: auctionData.title,
      seller: auctionData.seller,
      participationCode: auctionData.participationCode,
      imagesCount: auctionData.images?.length || 0,
      certificatesCount: auctionData.certificates?.length || 0
    });

    console.log('Creating auction...');

    // Add more detailed validation logging
    console.log('Full auction data for validation:', JSON.stringify(auctionData, null, 2));

    const auction = new Auction(auctionData);
    
    // Log before save to catch validation errors
    console.log('Auction instance created, attempting to save...');
    
    try {
      await auction.save();
      console.log('Auction created successfully:', auction._id);
    } catch (validationError) {
      console.error('Validation error during auction save:', validationError);
      console.error('Validation error details:', {
        name: validationError.name,
        message: validationError.message,
        errors: validationError.errors
      });
      throw validationError;
    }

    // Update the auction request
    auctionRequest.approvalStatus = 'approved';
    // Set reviewedBy to null if req.user is not available (no auth middleware)
    auctionRequest.reviewedBy = req.user?._id || null;
    auctionRequest.reviewedAt = new Date();
    auctionRequest.adminNotes = adminNotes || 'Approved by admin';
    auctionRequest.createdAuction = auction._id;
    await auctionRequest.save();

    console.log('Auction request updated successfully');

    await auction.populate('seller', 'fullName email');

    res.json({
      message: 'Auction request approved successfully',
      auction,
      auctionRequest
    });
  } catch (error) {
    console.error('Error approving auction request:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Error approving auction request', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Reject auction request
router.post('/auction-requests/:id/reject', async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const requestId = req.params.id;

    console.log('Rejecting auction request:', requestId);
    console.log('Admin notes:', adminNotes);

    const auctionRequest = await AuctionRequest.findById(requestId);
    if (!auctionRequest) {
      return res.status(404).json({ message: 'Auction request not found' });
    }

    if (auctionRequest.approvalStatus !== 'pending') {
      return res.status(400).json({ message: 'Auction request is not pending approval' });
    }

    console.log('Found auction request to reject:', auctionRequest.title);

    // Update the auction request
    auctionRequest.approvalStatus = 'rejected';
    auctionRequest.reviewedBy = req.user?._id || null; // Safe user reference
    auctionRequest.reviewedAt = new Date();
    auctionRequest.adminNotes = adminNotes || 'Request rejected by admin';
    await auctionRequest.save();

    console.log('Auction request rejected successfully');

    await auctionRequest.populate('reviewedBy', 'fullName email');

    res.json({
      message: 'Auction request rejected successfully',
      auctionRequest
    });
  } catch (error) {
    console.error('Error rejecting auction request:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Error rejecting auction request', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get auction request statistics
router.get('/auction-requests/stats', async (req, res) => {
  try {
    const stats = await AuctionRequest.aggregate([
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.json(formattedStats);
  } catch (error) {
    console.error('Error fetching auction request stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// Migrate existing reserve auctions to auction requests
router.post('/migrate-reserve-auctions', async (req, res) => {
  try {
    console.log('Starting migration of reserve auctions...');
    
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
      return res.json({ 
        message: 'No reserve auctions need migration',
        migrated: 0
      });
    }
    
    let migrated = 0;
    const errors = [];
    
    // Migrate each reserve auction to auction request
    for (const auction of reserveAuctions) {
      try {
        // Check if auction request already exists
        const existingRequest = await AuctionRequest.findOne({ 
          auctionId: auction.auctionId 
        });
        
        if (existingRequest) {
          console.log(`Auction request already exists for: ${auction.title}`);
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
          adminNotes: 'Migrated from existing reserve auction',
          submittedAt: auction.createdAt || new Date()
        };
        
        const auctionRequest = new AuctionRequest(auctionRequestData);
        await auctionRequest.save();
        
        // Delete the original auction to avoid conflicts
        await Auction.deleteOne({ _id: auction._id });
        
        migrated++;
        console.log(`Successfully migrated: ${auction.title}`);
        
      } catch (error) {
        console.error(`Error migrating auction ${auction.title}:`, error.message);
        errors.push({ title: auction.title, error: error.message });
      }
    }
    
    res.json({
      message: `Migration completed. ${migrated} auctions migrated.`,
      migrated,
      errors: errors.length > 0 ? errors : null
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ message: 'Error during migration', error: error.message });
  }
});

// Example admin auction route
router.get('/auctions', (req, res) => {
	res.json({ message: 'Admin auction route works!' });
});

module.exports = router;
