const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dhjbphutc',
  api_key: '331246492394814',
  api_secret: 'l8roORLEnkEhxYMJ2YpWmzcauus',
});

/**
 * Uploads a file to Cloudinary in the specified folder.
 * @param {string} filePath - Local path to the file.
 * @param {string} folder - Cloudinary folder (e.g. 'profiles', 'auctions/images', 'auctions/videos')
 * @param {string} [resourceType] - 'image' or 'video'. Defaults to 'image'.
 * @returns {Promise<string>} - The Cloudinary URL of the uploaded file.
 */
const uploadToCloudinary = async (filePath, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
};
