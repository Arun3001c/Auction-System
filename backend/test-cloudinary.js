const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadFromBase64() {
  try {
    console.log('Uploading PhonePe QR code to Cloudinary...');
    
    // Upload using the data URI for the PhonePe QR code
    // Since I can't directly access the image file, I'll provide a way to upload it
    
    // For now, let's test the Cloudinary connection
    console.log('Cloudinary configuration:');
    console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('API Key exists:', !!process.env.CLOUDINARY_API_KEY);
    console.log('API Secret exists:', !!process.env.CLOUDINARY_API_SECRET);
    
    // Test upload with a sample image URL or create one manually
    // You can manually upload the QR code and I'll help you get the URL
    
    const sampleUpload = await cloudinary.uploader.upload(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      {
        folder: 'payment-qr-codes',
        public_id: 'test-upload',
        overwrite: true
      }
    );
    
    console.log('Cloudinary connection successful!');
    console.log('Test upload URL:', sampleUpload.secure_url);
    
    // Since I can see your QR code image, let me help you with the manual upload process
    console.log('\n=== Manual Upload Instructions ===');
    console.log('1. Go to https://cloudinary.com/console');
    console.log('2. Login to your account');
    console.log('3. Go to Media Library');
    console.log('4. Click "Upload" button');
    console.log('5. Upload your PhonePe QR code image');
    console.log('6. After upload, right-click on the image and copy the URL');
    console.log('7. The URL should look like: https://res.cloudinary.com/dhjbphutc/image/upload/...');
    
    return null;
    
  } catch (error) {
    console.error('Cloudinary error:', error);
  }
}

uploadFromBase64();