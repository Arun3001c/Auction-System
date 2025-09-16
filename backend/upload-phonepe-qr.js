const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadQRCode() {
  try {
    console.log('Uploading PhonePe QR code...');
    
    // Since the QR code is for PUSAPATI MOHANA SIVA ARUN KUMAR with UPI ID 9346311161@ybl
    // I'll upload a placeholder and show you how to replace it with your actual QR code
    
    // For now, let me upload using a URL method
    // You can replace this with your actual QR code image URL or local file path
    
    const result = await cloudinary.uploader.upload(
      'https://via.placeholder.com/400x400/7B2CBF/FFFFFF?text=PhonePe+QR+Code',
      {
        folder: 'payment-qr-codes',
        public_id: 'admin-phonepe-qr-pusapati-mohana-siva-arun-kumar',
        overwrite: true,
        transformation: [
          { width: 400, height: 400, crop: 'fill' }
        ]
      }
    );
    
    console.log('Upload successful!');
    console.log('QR Code URL:', result.secure_url);
    
    // Update the .env file automatically
    const envPath = '.env';
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the ADMIN_UPI_QR line
    envContent = envContent.replace(
      /ADMIN_UPI_QR=.*/,
      `ADMIN_UPI_QR=${result.secure_url}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env file with QR code URL');
    
    return result.secure_url;
    
  } catch (error) {
    console.error('Error:', error);
  }
}

uploadQRCode();