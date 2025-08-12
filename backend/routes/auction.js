const express = require('express');
const Auction = require('../models/Auction');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all auctions with filters
router.get('/', async (req, res) => {
  try {
    const { category, status, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get auctions with pagination
    const auctions = await Auction.find(filter)
      .populate('seller', 'fullName')
      .populate('currentHighestBidder', 'fullName')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Update auction statuses based on current time
    const updatedAuctions = await Promise.all(
      auctions.map(async (auction) => {
        await auction.updateStatus();
        return auction;
      })
    );

    // Get total count for pagination
    const total = await Auction.countDocuments(filter);

    res.json({
      auctions: updatedAuctions,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({ message: 'Server error fetching auctions' });
  }
});

// Get featured auctions for home page
router.get('/featured', async (req, res) => {
  try {
    const auctions = await Auction.find({ 
      featured: true,
      status: { $in: ['active', 'upcoming'] }
    })
      .populate('seller', 'fullName')
      .populate('currentHighestBidder', 'fullName')
      .sort('-createdAt')
      .limit(15);

    // Update auction statuses
    const updatedAuctions = await Promise.all(
      auctions.map(async (auction) => {
        await auction.updateStatus();
        return auction;
      })
    );

    res.json(updatedAuctions);

  } catch (error) {
    console.error('Get featured auctions error:', error);
    res.status(500).json({ message: 'Server error fetching featured auctions' });
  }
});

// Get auction categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      'Electronics',
      'Art',
      'Collectibles',
      'Jewelry',
      'Vehicles',
      'Fashion',
      'Sports',
      'Books',
      'Other'
    ];

    // Get count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await Auction.countDocuments({ 
          category,
          status: { $in: ['active', 'upcoming'] }
        });
        return { name: category, count };
      })
    );

    res.json(categoriesWithCount);

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

// Get single auction by ID
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'fullName email profileImg')
      .populate('currentHighestBidder', 'fullName')
      .populate('bids.bidder', 'fullName');

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Update auction status
    await auction.updateStatus();

    res.json(auction);

  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({ message: 'Server error fetching auction' });
  }
});

// Search auctions
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { category, page = 1, limit = 20 } = req.query;

    // Build search filter
    const filter = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    };

    if (category && category !== 'all') {
      filter.category = category;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Search auctions
    const auctions = await Auction.find(filter)
      .populate('seller', 'fullName')
      .populate('currentHighestBidder', 'fullName')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    // Update auction statuses
    const updatedAuctions = await Promise.all(
      auctions.map(async (auction) => {
        await auction.updateStatus();
        return auction;
      })
    );

    // Get total count
    const total = await Auction.countDocuments(filter);

    res.json({
      auctions: updatedAuctions,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      },
      query
    });

  } catch (error) {
    console.error('Search auctions error:', error);
    res.status(500).json({ message: 'Server error searching auctions' });
  }
});

// Place bid (requires authentication)
router.post('/:id/bid', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const auctionId = req.params.id;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid bid amount is required' });
    }

    const auction = await Auction.findById(auctionId);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Update auction status
    await auction.updateStatus();

    if (auction.status !== 'active') {
      return res.status(400).json({ message: 'Auction is not active' });
    }

    if (auction.seller.toString() === userId.toString()) {
      return res.status(400).json({ message: 'You cannot bid on your own auction' });
    }

    if (amount <= auction.currentBid) {
      return res.status(400).json({ 
        message: `Bid must be higher than current bid of $${auction.currentBid}` 
      });
    }

    if (amount < auction.currentBid + auction.bidIncrement) {
      return res.status(400).json({ 
        message: `Minimum bid increment is $${auction.bidIncrement}` 
      });
    }

    // Add bid to auction
    auction.bids.push({
      bidder: userId,
      amount: amount,
      timestamp: new Date()
    });

    // Update current bid and highest bidder
    auction.currentBid = amount;
    auction.currentHighestBidder = userId;

    await auction.save();

    // Populate the updated auction
    const updatedAuction = await Auction.findById(auctionId)
      .populate('seller', 'fullName')
      .populate('currentHighestBidder', 'fullName')
      .populate('bids.bidder', 'fullName');

    res.json({
      message: 'Bid placed successfully',
      auction: updatedAuction
    });

  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({ message: 'Server error placing bid' });
  }
});

// Get user's bidding history
router.get('/user/bids', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const auctions = await Auction.find({
      'bids.bidder': userId
    })
      .populate('seller', 'fullName')
      .populate('currentHighestBidder', 'fullName')
      .sort('-updatedAt');

    // Filter to get user's bids and add bid info
    const userBids = auctions.map(auction => {
      const userBidsForAuction = auction.bids.filter(
        bid => bid.bidder.toString() === userId.toString()
      );
      
      const highestUserBid = userBidsForAuction.reduce((max, bid) => 
        bid.amount > max.amount ? bid : max
      );

      return {
        auction: {
          _id: auction._id,
          title: auction.title,
          image: auction.image,
          currentBid: auction.currentBid,
          status: auction.status,
          endTime: auction.endTime,
          seller: auction.seller,
          currentHighestBidder: auction.currentHighestBidder
        },
        userHighestBid: highestUserBid.amount,
        bidTime: highestUserBid.timestamp,
        isWinning: auction.currentHighestBidder && 
                  auction.currentHighestBidder._id.toString() === userId.toString()
      };
    });

    res.json(userBids);

  } catch (error) {
    console.error('Get user bids error:', error);
    res.status(500).json({ message: 'Server error fetching user bids' });
  }
});

// Create new auction
router.post('/', auth, upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      auctionId,
      title,
      description,
      category,
      auctionType,
      startingPrice,
      reservePrice,
      minimumPrice,
      startDate,
      endDate
    } = req.body;

    // Validate required fields
    if (!auctionId || !title || !description || !category || !auctionType || !startingPrice || !startDate || !endDate) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Check if auction ID already exists
    const existingAuction = await Auction.findOne({ auctionId });
    if (existingAuction) {
      return res.status(400).json({ message: 'Auction ID already exists' });
    }

    // Validate images
    if (!req.files || !req.files.images || req.files.images.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    // Validate date constraints
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start <= now) {
      return res.status(400).json({ message: 'Start date must be in the future' });
    }

    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Process uploaded files
    const images = req.files.images.map(file => `/uploads/${file.filename}`);
    const video = req.files.video ? `/uploads/${req.files.video[0].filename}` : null;

    // Create auction object
    const auctionData = {
      auctionId,
      title,
      description,
      category,
      auctionType,
      images,
      video,
      startingPrice: parseFloat(startingPrice),
      startDate: start,
      endDate: end,
      seller: req.user._id
    };

    // Add auction type specific fields
    if (auctionType === 'sealed' && reservePrice) {
      auctionData.reservePrice = parseFloat(reservePrice);
    }

    if (auctionType === 'reserve' && minimumPrice) {
      auctionData.minimumPrice = parseFloat(minimumPrice);
    }

    // Create the auction
    const auction = new Auction(auctionData);
    await auction.save();

    // Populate seller information
    await auction.populate('seller', 'fullName email');

    res.status(201).json({
      message: 'Auction created successfully',
      auction
    });

  } catch (error) {
    console.error('Create auction error:', error);
    res.status(500).json({ message: 'Server error creating auction' });
  }
});

module.exports = router;
