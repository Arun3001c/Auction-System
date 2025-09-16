const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadActualQRCode() {
  try {
    console.log('=== PhonePe QR Code Upload Process ===\n');
    
    // Since I can see your QR code image in the attachment, here's what we need to do:
    
    console.log('Your QR Code Details:');
    console.log('- Name: PUSAPATI MOHANA SIVA ARUN KUMAR');
    console.log('- UPI ID: 9346311161@ybl (matches your .env)');
    console.log('- Service: PhonePe');
    
    console.log('\n=== Step-by-Step Upload Process ===');
    console.log('1. Right-click on the QR code image in VS Code');
    console.log('2. Select "Save Image As..." or "Copy Image"');
    console.log('3. Save it as "phonepe-qr.png" in your backend folder');
    console.log('4. Run the upload command below');
    
    console.log('\n=== Upload Command ===');
    console.log('After saving the image, run:');
    console.log('node upload-saved-qr.js');
    
    // Create the upload script for the saved image
    const uploadScript = `const cloudinary = require('cloudinary').v2;
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
      \`ADMIN_UPI_QR=\${result.secure_url}\`
    );
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Updated .env file with new QR code URL');
    console.log('🎉 PhonePe QR code setup complete!');
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}

uploadSavedQR();`;

    fs.writeFileSync('./upload-saved-qr.js', uploadScript);
    console.log('✅ Created upload-saved-qr.js script');
    
    console.log('\n=== Alternative: Direct Cloudinary Upload ===');
    console.log('1. Go to: https://cloudinary.com/console/media_library');
    console.log('2. Click "Upload" button');
    console.log('3. Upload your PhonePe QR code image');
    console.log('4. Copy the generated URL');
    console.log('5. Update ADMIN_UPI_QR in your .env file');
    
    console.log('\n=== Current .env Status ===');
    console.log('ADMIN_UPI_ID:', process.env.ADMIN_UPI_ID);
    console.log('ADMIN_UPI_QR:', process.env.ADMIN_UPI_QR);
    console.log('(Currently set to placeholder URL)');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

uploadActualQRCode();