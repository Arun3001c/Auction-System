// Copy and paste this into your browser console on the admin page

// Set the admin token
localStorage.setItem('adminToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Yzk2MDNiMzNiMjkwNGJkYmU3MzAyZiIsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTgwMjc5MTQsImV4cCI6MTc1ODExNDMxNH0.lnZIhgFT-4oPRZt7cY3yCh8Pj0J-g3XKf9HqZ8NfwDI');

console.log('Admin token set successfully!');
console.log('Current token:', localStorage.getItem('adminToken'));

// Refresh the page to load payment requests
window.location.reload();