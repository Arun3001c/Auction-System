const axios = require('axios');

// Test data - we know this auction exists and has bids
const auctionId = '68c8d15f6b87ddfdc70be50a'; // tfrauction

async function testNewEndpoint() {
  try {
    console.log('Testing new created-bids endpoint...');
    console.log('Auction ID:', auctionId);
    
    // We need to use a regular user token, not admin token
    // For now, let's test if the endpoint exists by calling it
    const response = await axios.get(`http://localhost:5001/api/auctions/user/created-bids/${auctionId}`, {
      headers: { 
        'Authorization': 'Bearer fake-token-for-testing',
        'Content-Type': 'application/json' 
      }
    });
    
    console.log('Success! Response:', response.data);
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Endpoint exists (401 Unauthorized - expected without valid token)');
      console.log('Response:', error.response.data);
    } else if (error.response?.status === 403) {
      console.log('✅ Endpoint exists (403 Forbidden - user not owner)');
      console.log('Response:', error.response.data);
    } else if (error.response?.status === 404) {
      console.log('❌ Endpoint not found (404)');
      console.log('Response:', error.response.data);
    } else {
      console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
    }
  }
}

testNewEndpoint();