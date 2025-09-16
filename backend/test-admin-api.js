const axios = require('axios');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Yzk2MDNiMzNiMjkwNGJkYmU3MzAyZiIsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTgwMjc5MTQsImV4cCI6MTc1ODExNDMxNH0.lnZIhgFT-4oPRZt7cY3yCh8Pj0J-g3XKf9HqZ8NfwDI';

async function testAPI() {
  try {
    console.log('Testing payment requests API...');
    
    const response = await axios.get('http://localhost:5001/api/admin/payments/payment-requests', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Success!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data || error.message);
  }
}

testAPI();