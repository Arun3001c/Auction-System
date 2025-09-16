const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadQRCode() {
  try {
    // The QR code image will be uploaded from the attachment
    // For now, we'll create a placeholder and show you the process
    
    console.log('Cloudinary configuration:');
    console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set');
    console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set');
    
    // Upload the QR code image
    const result = await cloudinary.uploader.upload('./phonepe-qr.png', {
      folder: 'payment-qr-codes',
      public_id: 'admin-phonepe-qr',
      overwrite: true,
      resource_type: 'image'
    });
    
    console.log('Upload successful!');
    console.log('QR Code URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    
    return result.secure_url;
    
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

// Only run if called directly
if (require.main === module) {
  require('dotenv').config();
  uploadQRCode()
    .then(url => {
      console.log('\nCopy this URL to your .env file:');
      console.log(`ADMIN_UPI_QR=${url}`);
    })
    .catch(console.error);
}

module.exports = { uploadQRCode };