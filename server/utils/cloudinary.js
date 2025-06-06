const cloudinary = require('cloudinary').v2;
const path = require('path');

// Load environment variables from server root
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Configure with credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Verify configuration
console.log('✅ Cloudinary Configured:', {
  cloud_name: cloudinary.config().cloud_name,
  api_key: cloudinary.config().api_key,
  api_secret: cloudinary.config().api_secret ? '***' : 'MISSING'
});

module.exports = cloudinary;