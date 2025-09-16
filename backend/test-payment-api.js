const axios = require('axios');

async function testPaymentAPI() {
  try {
    console.log('Testing payment details API...');
    console.log('ADMIN_UPI_QR from env:', process.env.ADMIN_UPI_QR);
    
    // The API endpoint for payment details
    const baseUrl = 'http://localhost:5001';
    
    // You'll need to replace this with a valid auction ID from your database
    // For testing, let's create a mock response structure
    const mockPaymentDetails = {
      auctionId: 'test-auction-id',
      auctionTitle: 'Test Auction',
      initialPaymentAmount: 1000,
      currency: 'INR',
      paymentMethods: {
        upi: {
          id: process.env.ADMIN_UPI_ID || 'admin@paytm',
          qrCode: process.env.ADMIN_UPI_QR || null,
          name: 'Auction System Admin'
        },
        bankTransfer: {
          accountNumber: process.env.ADMIN_ACCOUNT_NUMBER || '1234567890',
          ifsc: process.env.ADMIN_IFSC || 'BANK0001234',
          accountName: 'Auction System',
          bankName: process.env.ADMIN_BANK_NAME || 'Example Bank'
        }
      }
    };
    
    console.log('\nMock Payment Details Response:');
    console.log(JSON.stringify(mockPaymentDetails, null, 2));
    
    // Check if QR URL is accessible
    if (mockPaymentDetails.paymentMethods.upi.qrCode) {
      console.log('\nTesting QR Code URL accessibility...');
      try {
        const response = await axios.head(mockPaymentDetails.paymentMethods.upi.qrCode, {
          timeout: 10000
        });
        console.log('✅ QR Code URL is accessible');
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
        console.log('Content-Length:', response.headers['content-length']);
      } catch (error) {
        console.log('❌ QR Code URL is not accessible');
        console.log('Error:', error.message);
      }
    } else {
      console.log('❌ No QR Code URL found in environment variables');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Load environment variables
require('dotenv').config();
testPaymentAPI();