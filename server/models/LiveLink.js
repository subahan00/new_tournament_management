const mongoose = require('mongoose');

const liveLinkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  },
  links: [{
    platform: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    }
  }],
  
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 28800 // 8 hours in seconds (8 * 60 * 60)
  }
}, {
  timestamps: true
});

// Index for automatic deletion
liveLinkSchema.index({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

// Pre-remove middleware to delete image from Cloudinary
liveLinkSchema.pre('remove', async function(next) {
  if (this.image && this.image.publicId) {
    try {
      const cloudinary = require('../config/cloudinary');
      await cloudinary.uploader.destroy(this.image.publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }
  }
  next();
});

module.exports = mongoose.model('LiveLink', liveLinkSchema);