const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../utils/cloudinary'); // Use centralized config
const Wallpaper = require('../models/Wallpaper');
const { authenticate } = require('../utils/middlewares'); // ✅ Correct path if needed


// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    // Validate configuration exists
    if (!cloudinary.config().api_key) {
      console.error('❌ Cloudinary API key missing!');
      return reject(new Error('Cloudinary not configured'));
    }

    const uploadOptions = {
      resource_type: 'image',
      folder: 'football-wallpapers',
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Create readable stream from buffer
    const { Readable } = require('stream');
    const stream = Readable.from(buffer);
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      reject(err);
    });
    stream.pipe(uploadStream);
  });
};
// ADMIN ROUTES

// Upload wallpaper (Admin only)
router.post('/admin/upload',authenticate, upload.single('wallpaper'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const { title, description, tags, category, featured } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    // Upload original image
    const originalUpload = await uploadToCloudinary(req.file.buffer, {
      transformation: [
        { quality: 'auto:best' },
        { fetch_format: 'auto' }
      ]
    });

    // Upload thumbnail
    const thumbnailUpload = await uploadToCloudinary(req.file.buffer, {
      transformation: [
        { width: 400, height: 300, crop: 'fill' },
        { quality: 'auto:good' }
      ]
    });

    // Parse tags
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : [];

    // Create wallpaper document
    const wallpaper = new Wallpaper({
      title: title.trim(),
      description: description.trim(),
      tags: parsedTags,
      cloudinaryId: originalUpload.public_id,
      imageUrl: originalUpload.secure_url,
      thumbnailUrl: thumbnailUpload.secure_url,
      resolution: {
        width: originalUpload.width,
        height: originalUpload.height
      },
      fileSize: originalUpload.bytes,
      category: category || 'players',
      featured: featured === 'true',
      uploadedBy: req.user.id
    });

    await wallpaper.save();

    res.status(201).json({
      message: 'Wallpaper uploaded successfully',
      wallpaper
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading wallpaper', error: error.message });
  }
});

// Get all wallpapers for admin
router.get('/admin/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const wallpapers = await Wallpaper.find()
  
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Wallpaper.countDocuments();

    res.json({
      wallpapers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wallpapers', error: error.message });
  }
});

// Update wallpaper (Admin only)
router.put('/admin/:id', async (req, res) => {
  try {
    const { title, description, tags, category, featured } = req.body;
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : [];

    const wallpaper = await Wallpaper.findByIdAndUpdate(
      req.params.id,
      {
        title: title?.trim(),
        description: description?.trim(),
        tags: parsedTags,
        category,
        featured: featured === 'true',
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!wallpaper) {
      return res.status(404).json({ message: 'Wallpaper not found' });
    }

    res.json({ message: 'Wallpaper updated successfully', wallpaper });
  } catch (error) {
    res.status(500).json({ message: 'Error updating wallpaper', error: error.message });
  }
});

// Delete wallpaper (Admin only)
router.delete('/admin/:id', async (req, res) => {
  try {
    const wallpaper = await Wallpaper.findById(req.params.id);
    
    if (!wallpaper) {
      return res.status(404).json({ message: 'Wallpaper not found' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(wallpaper.cloudinaryId);

    // Delete from database
    await Wallpaper.findByIdAndDelete(req.params.id);

    res.json({ message: 'Wallpaper deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting wallpaper', error: error.message });
  }
});

// PUBLIC ROUTES

// Get public wallpapers with search and filtering
router.get('/public', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { search, category, tag, sort = 'newest' } = req.query; // Added tag

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    // Add tag filtering - this is the new section
    if (tag && tag !== 'all') {
      query.tags = { 
        $regex: tag, 
        $options: 'i'  // Case-insensitive matching
      };
    }

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'popular':
        sortOption = { downloads: -1 };
        break;
      case 'liked':
        sortOption = { likes: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const wallpapers = await Wallpaper.find(query)
      .select('-cloudinaryId -uploadedBy')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Wallpaper.countDocuments(query);

    res.json({
      wallpapers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wallpapers', error: error.message });
  }
});
// Get featured wallpapers
router.get('/public/featured', async (req, res) => {
  try {
    console.log("🟢 /public/featured route hit");

    const wallpapers = await Wallpaper.find({ featured: true }).limit(1);
    
    console.log("✅ Wallpapers fetched:", wallpapers);

    res.json(wallpapers);
  } catch (error) {
    console.error('❌ Error in /public/featured:', error);
    res.status(500).json({ 
      message: 'Server error occurred while fetching featured wallpapers', 
      error: error.message 
    });
  }
});
// Get categories with counts
router.get('/public/categories', async (req, res) => {
  try {
    const categories = await Wallpaper.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Get popular tags
router.get('/public/tags', async (req, res) => {
  try {
    const tags = await Wallpaper.aggregate([
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tags', error: error.message });
  }
});
// Get single wallpaper details
router.get('/public/:id', async (req, res) => {
  try {
    const wallpaper = await Wallpaper.findById(req.params.id)
      .select('-cloudinaryId -uploadedBy');

    if (!wallpaper) {
      return res.status(404).json({ message: 'Wallpaper not found' });
    }

    res.json(wallpaper);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wallpaper', error: error.message });
  }
});

// Track download
router.post('/public/:id/download', async (req, res) => {
  try {
    const wallpaper = await Wallpaper.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!wallpaper) {
      return res.status(404).json({ message: 'Wallpaper not found' });
    }

    res.json({ 
      message: 'Download tracked',
      downloadUrl: wallpaper.imageUrl,
      downloads: wallpaper.downloads
    });
  } catch (error) {
    res.status(500).json({ message: 'Error tracking download', error: error.message });
  }
});

// Like wallpaper
router.post('/public/:id/like', async (req, res) => {
  try {
    const wallpaper = await Wallpaper.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!wallpaper) {
      return res.status(404).json({ message: 'Wallpaper not found' });
    }

    res.json({ 
      message: 'Like added',
      likes: wallpaper.likes
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding like', error: error.message });
  }
});








module.exports = router;