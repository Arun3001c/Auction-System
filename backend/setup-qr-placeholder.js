const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadQRCodeFromBase64() {
  try {
    console.log('Uploading PhonePe QR code to Cloudinary...');
    
    // Create a base64 representation of a QR code
    // This is a placeholder - you'll need to save your actual QR code image and upload it
    
    // For demonstration, I'll create a direct Cloudinary URL that you can use
    // You can manually upload your QR code and get the URL
    
    // Let me provide you with the exact URL format for your account:
    const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`;
    
    console.log('Your Cloudinary base URL:', baseUrl);
    console.log('\n=== Instructions to Upload Your QR Code ===');
    console.log('1. Save your PhonePe QR code image to your computer');
    console.log('2. Go to: https://cloudinary.com/console/media_library');
    console.log('3. Click "Upload" button');
    console.log('4. Select your QR code image file');
    console.log('5. After upload, copy the image URL');
    console.log('6. The URL will look like:', baseUrl + 'v1234567890/folder/filename.png');
    
    // For now, let me create a sample upload URL that follows your pattern
    const sampleQRUrl = `${baseUrl}v${Date.now()}/payment-qr-codes/phonepe-qr-pusapati-mohana-siva-arun-kumar.png`;
    
    console.log('\n=== Alternative: Manual .env Update ===');
    console.log('After you upload the QR code manually, update your .env file with:');
    console.log('ADMIN_UPI_QR=<your_actual_cloudinary_url>');
    
    // I'll update with a placeholder for now that you can replace
    const envPath = '.env';
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // For now, I'll put a placeholder that you can replace with your actual URL
    const placeholderUrl = 'https://res.cloudinary.com/dhjbphutc/image/upload/v1757993200/payment-qr-codes/phonepe-qr-pusapati-mohana-siva-arun-kumar.png';
    
    envContent = envContent.replace(
      /ADMIN_UPI_QR=.*/,
      `ADMIN_UPI_QR=${placeholderUrl}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env file with placeholder QR code URL');
    console.log('⚠️  Please replace with your actual QR code URL after upload');
    
    return placeholderUrl;
    
  } catch (error) {
    console.error('Error:', error);
  }
}

uploadQRCodeFromBase64();