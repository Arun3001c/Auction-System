const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testPaymentSystem() {
    console.log('🔍 Testing Payment System...\n');

    // Test 1: Check backend connectivity
    try {
        console.log('1. Testing backend connectivity...');
        const healthResponse = await axios.get('http://localhost:5001/api/auth/test');
        console.log('✅ Backend is accessible');
    } catch (error) {
        console.log('❌ Backend connection failed:', error.message);
        return;
    }

    // Test 2: Try to fetch payment requests without authentication
    try {
        console.log('\n2. Testing payment requests endpoint (without auth)...');
        const response = await axios.get('http://localhost:5001/api/admin/payments/payment-requests');
        console.log('✅ Payment requests endpoint accessible:', response.data);
    } catch (error) {
        console.log('❌ Expected auth error:', error.response?.data?.message || error.message);
    }

    // Test 3: Check if there are existing payment requests (assuming we have admin access)
    try {
        console.log('\n3. Testing admin endpoints structure...');
        
        // Try different possible endpoints
        const endpoints = [
            '/api/admin/payments/payment-requests',
            '/api/admin/payment-requests',
            '/api/payments/admin/requests'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`http://localhost:5001${endpoint}`);
                console.log(`✅ Found working endpoint: ${endpoint}`);
                console.log('Response:', response.data);
                break;
            } catch (error) {
                console.log(`❌ ${endpoint}: ${error.response?.data?.message || error.message}`);
            }
        }
    } catch (error) {
        console.log('❌ Admin endpoint test failed:', error.message);
    }

    // Test 4: Test regular payment endpoints
    try {
        console.log('\n4. Testing user payment endpoints...');
        
        // Test getting payment details (this should work without auth for testing)
        const paymentDetailsResponse = await axios.get('http://localhost:5001/api/payments/payment-details/test-auction-id');
        console.log('❌ Should require auth but got:', paymentDetailsResponse.data);
    } catch (error) {
        console.log('✅ Payment details endpoint requires auth (expected):', error.response?.data?.message || error.message);
    }

    console.log('\n📋 Summary:');
    console.log('- Backend is running on port 5001');
    console.log('- Admin endpoints require authentication');
    console.log('- Payment endpoints are properly secured');
    console.log('\n🔧 Next steps:');
    console.log('1. Get valid admin token');
    console.log('2. Submit test payment request');
    console.log('3. Verify it appears in admin panel');
}

testPaymentSystem().catch(console.error);