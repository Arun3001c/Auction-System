const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../utils/cloudinary');

// Create Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req, file) => {
      // Determine folder based on field name
      if (file.fieldname === 'profileImg') {
        return 'auction-system/profiles';
      } else if (file.fieldname === 'auctionImage') {
        return 'auction-system/auctions';
      } else if (file.fieldname === 'paymentScreenshot') {
        return 'auction-system/payments';
      } else if (file.fieldname === 'certificates') {
        return 'auction-system/certificates';
      } else {
        return 'auction-system/uploads';
      }
    },
    resource_type: 'auto', // Automatically detect resource type (image/video)
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi'],
    transformation: [
      {
        quality: 'auto:good',
        fetch_format: 'auto'
      }
    ]
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allow images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

// Create multer upload middleware with Cloudinary storage
const cloudinaryUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (increased for videos)
  },
  fileFilter: fileFilter
});

module.exports = cloudinaryUpload;