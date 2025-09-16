const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadSavedQR() {
  try {
    if (!fs.existsSync('./phonepe-qr.png')) {
      console.log('❌ phonepe-qr.png not found!');
      console.log('Please save your QR code image as "phonepe-qr.png" in this folder');
      return;
    }
    
    console.log('📤 Uploading QR code to Cloudinary...');
    
    const result = await cloudinary.uploader.upload('./phonepe-qr.png', {
      folder: 'payment-qr-codes',
      public_id: 'phonepe-qr-pusapati-mohana-siva-arun-kumar',
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'limit', quality: 'auto' }
      ]
    });
    
    console.log('✅ Upload successful!');
    console.log('QR Code URL:', result.secure_url);
    
    // Update .env file
    const envPath = '.env';
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(
      /ADMIN_UPI_QR=.*/,
      `ADMIN_UPI_QR=${result.secure_url}`
    );
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Updated .env file with new QR code URL');
    console.log('🎉 PhonePe QR code setup complete!');
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}

uploadSavedQR();