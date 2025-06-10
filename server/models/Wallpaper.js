
// models/Wallpaper.js
const mongoose = require('mongoose');

const wallpaperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  cloudinaryId: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  resolution: {
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  fileSize: {
    type: Number, // in bytes
    required: true
  },
  category: {
    type: String,
    enum: ['players', 'teams', 'stadiums', 'action', 'vintage', 'logos', 'abstract'],
    default: 'players'
  },
  downloads: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
wallpaperSchema.index({ tags: 1 });
wallpaperSchema.index({ category: 1 });
wallpaperSchema.index({ featured: -1, createdAt: -1 });
wallpaperSchema.index({ downloads: -1 });
wallpaperSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Wallpaper', wallpaperSchema);