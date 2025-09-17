// Test the image URL formatting function
const formatImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Convert Windows backslashes to forward slashes for web URLs
  const normalizedPath = imagePath.replace(/\\/g, '/');
  
  // Ensure path starts with uploads/ 
  const finalPath = normalizedPath.startsWith('uploads/') 
    ? normalizedPath 
    : `uploads/${normalizedPath}`;
  
  return `http://localhost:5001/${finalPath}`;
};

// Test with the actual URL from database
const testUrl = 'uploads\\paymentScreenshot-1758128024990-879178458.png';
console.log('Original URL:', testUrl);
console.log('Formatted URL:', formatImageUrl(testUrl));

// Test with other formats
console.log('Cloudinary URL:', formatImageUrl('https://res.cloudinary.com/example/image.jpg'));
console.log('Already formatted:', formatImageUrl('uploads/image.jpg'));
console.log('Without uploads prefix:', formatImageUrl('paymentScreenshot-123.png'));