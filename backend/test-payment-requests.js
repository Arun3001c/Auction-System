const mongoose = require('mongoose');
const PaymentRequest = require('./models/PaymentRequest');
const User = require('./models/User');
const Auction = require('./models/Auction');

const createTestPaymentRequests = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/onlineauction');
    console.log('Connected to MongoDB');

    // Find some existing users and auctions
    const users = await User.find().limit(3);
    const auctions = await Auction.find({ auctionType: 'reserve' }).limit(2);

    if (users.length === 0) {
      console.log('No users found. Please create some users first.');
      return;
    }

    if (auctions.length === 0) {
      console.log('No reserve auctions found. Please create some reserve auctions first.');
      return;
    }

    // Create sample payment requests
    const samplePaymentRequests = [
      {
        auction: auctions[0]._id,
        user: users[0]._id,
        paymentAmount: 100,
        paymentMethod: 'UPI',
        paymentScreenshot: 'https://via.placeholder.com/400x600/4CAF50/FFFFFF?text=Payment+Screenshot+1',
        transactionId: 'TXN123456789',
        paymentDate: new Date(),
        verificationStatus: 'pending'
      },
      {
        auction: auctions[0]._id,
        user: users[1]._id,
        paymentAmount: 150,
        paymentMethod: 'Bank Transfer',
        paymentScreenshot: 'https://via.placeholder.com/400x600/2196F3/FFFFFF?text=Payment+Screenshot+2',
        transactionId: 'TXN987654321',
        paymentDate: new Date(),
        verificationStatus: 'pending'
      }
    ];

    if (auctions.length > 1) {
      samplePaymentRequests.push({
        auction: auctions[1]._id,
        user: users[2] ? users[2]._id : users[0]._id,
        paymentAmount: 200,
        paymentMethod: 'UPI',
        paymentScreenshot: 'https://via.placeholder.com/400x600/FF9800/FFFFFF?text=Payment+Screenshot+3',
        transactionId: 'TXN555666777',
        paymentDate: new Date(),
        verificationStatus: 'pending'
      });
    }

    // Check if payment requests already exist
    const existingRequests = await PaymentRequest.find();
    if (existingRequests.length > 0) {
      console.log(`Found ${existingRequests.length} existing payment requests.`);
      console.log('Sample payment requests:');
      existingRequests.slice(0, 3).forEach((req, index) => {
        console.log(`${index + 1}. User: ${req.user}, Auction: ${req.auction}, Status: ${req.verificationStatus}, Amount: ${req.paymentAmount}`);
      });
    } else {
      // Create new payment requests
      const createdRequests = await PaymentRequest.insertMany(samplePaymentRequests);
      console.log(`Created ${createdRequests.length} sample payment requests:`);
      
      for (const request of createdRequests) {
        await request.populate('user', 'fullName email');
        await request.populate('auction', 'title auctionId');
        console.log(`- ${request.user.fullName} paid ${request.paymentAmount} for auction "${request.auction.title}"`);
      }
    }

    // Show statistics
    const stats = await PaymentRequest.aggregate([
      { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
    ]);

    console.log('\nPayment Request Statistics:');
    stats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count}`);
    });

    const total = await PaymentRequest.countDocuments();
    console.log(`Total payment requests: ${total}`);

  } catch (error) {
    console.error('Error creating test payment requests:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestPaymentRequests();