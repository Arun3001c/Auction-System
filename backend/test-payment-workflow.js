const axios = require('axios');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Yzk2MDNiMzNiMjkwNGJkYmU3MzAyZiIsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTgwMjc5MTQsImV4cCI6MTc1ODExNDMxNH0.lnZIhgFT-4oPRZt7cY3yCh8Pj0J-g3XKf9HqZ8NfwDI';

async function testWorkflow() {
  try {
    console.log('=== Testing Complete Payment Workflow ===\n');
    
    // 1. Get current payment requests
    console.log('1. Fetching current payment requests...');
    const getResponse = await axios.get('http://localhost:5001/api/admin/payments/payment-requests', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`Found ${getResponse.data.paymentRequests.length} payment request(s)`);
    
    if (getResponse.data.paymentRequests.length > 0) {
      const paymentRequest = getResponse.data.paymentRequests[0];
      const paymentId = paymentRequest._id;
      
      console.log(`\nPayment Details:`);
      console.log(`- ID: ${paymentId}`);
      console.log(`- User: ${paymentRequest.user.fullName}`);
      console.log(`- Amount: ${paymentRequest.paymentAmount}`);
      console.log(`- Status: ${paymentRequest.verificationStatus}`);
      
      if (paymentRequest.verificationStatus === 'pending') {
        // 2. Test approval
        console.log('\n2. Testing payment approval...');
        const approveResponse = await axios.post(
          `http://localhost:5001/api/admin/payments/payment-requests/${paymentId}/approve`,
          { adminNotes: 'Payment verified and approved for bidding eligibility' },
          { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
        
        console.log('✅ Approval successful!');
        console.log(`- New status: ${approveResponse.data.paymentRequest.verificationStatus}`);
        console.log(`- Bidding eligible from: ${approveResponse.data.paymentRequest.biddingEligibleFrom}`);
        console.log(`- Admin notes: ${approveResponse.data.paymentRequest.adminNotes}`);
        
        // 3. Verify the change
        console.log('\n3. Verifying payment status change...');
        const verifyResponse = await axios.get('http://localhost:5001/api/admin/payments/payment-requests', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const updatedPayment = verifyResponse.data.paymentRequests.find(p => p._id === paymentId);
        console.log(`✅ Status verified: ${updatedPayment.verificationStatus}`);
        console.log(`✅ Counts: Pending=${verifyResponse.data.counts.pending}, Approved=${verifyResponse.data.counts.approved}`);
        
      } else {
        console.log(`\n⚠️ Payment is already ${paymentRequest.verificationStatus}, cannot test approval`);
      }
    }
    
    console.log('\n🎉 Payment workflow testing completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error.response?.data || error.message);
  }
}

testWorkflow();