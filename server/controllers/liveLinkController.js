const LiveLink = require('../models/LiveLink');
const cloudinary = require('../utils/cloudinary');
const asyncHandler = require('express-async-handler');

// @desc    Create new live link
// @route   POST /api/livelinks
// @access  Public (no auth)
const createLiveLink = asyncHandler(async (req, res) => {
  try {
    const { title, description, links } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Upload image to Cloudinary (use Data URI)
    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
      {
        folder: 'live-links',
        resource_type: 'auto'
      }
    );

    // Parse links if it's a string (from FormData)
    let parsedLinks = links;
    if (typeof links === 'string') {
      try {
        parsedLinks = JSON.parse(links);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid links format' });
      }
    }

    const liveLink = new LiveLink({
      title,
      description,
      image: {
        url: result.secure_url,
        publicId: result.public_id
      },
      links: parsedLinks,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // auto delete after 8 hours
    });

    const savedLiveLink = await liveLink.save();

    res.status(201).json(savedLiveLink);
  } catch (error) {
    console.error('Error creating live link:', error);
    res.status(500).json({ message: 'Server error while creating live link' });
  }
});

// @desc    Get all active live links
// @route   GET /api/livelinks
// @access  Public
const getLiveLinks = asyncHandler(async (req, res) => {
  try {
    const liveLinks = await LiveLink.find({ 
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: -1 });

    res.json(liveLinks);
  } catch (error) {
    console.error('Error fetching live links:', error);
    res.status(500).json({ message: 'Server error while fetching live links' });
  }
});

// @desc    Get single live link
// @route   GET /api/livelinks/:id
// @access  Public
const getLiveLink = asyncHandler(async (req, res) => {
  try {
    const liveLink = await LiveLink.findById(req.params.id);

    if (!liveLink) {
      return res.status(404).json({ message: 'Live link not found' });
    }

    if (!liveLink.isActive || liveLink.expiresAt < new Date()) {
      return res.status(404).json({ message: 'Live link has expired' });
    }

    res.json(liveLink);
  } catch (error) {
    console.error('Error fetching live link:', error);
    res.status(500).json({ message: 'Server error while fetching live link' });
  }
});

// @desc    Update live link
// @route   PUT /api/livelinks/:id
// @access  Public (no auth check)
const updateLiveLink = asyncHandler(async (req, res) => {
  try {
    const { title, description, links, isActive } = req.body;
    
    const liveLink = await LiveLink.findById(req.params.id);
    
    if (!liveLink) {
      return res.status(404).json({ message: 'Live link not found' });
    }

    let imageData = liveLink.image;

    // If new image is uploaded
    if (req.file) {
      // Delete old image from Cloudinary
      if (liveLink.image && liveLink.image.publicId) {
        await cloudinary.uploader.destroy(liveLink.image.publicId);
      }

      // Upload new image
      const result = await cloudinary.uploader.upload(
        req.file.buffer.toString('base64'),
        {
          folder: 'live-links',
          resource_type: 'auto'
        }
      );

      imageData = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }

    // Parse links if it's a string
    let parsedLinks = links;
    if (typeof links === 'string') {
      try {
        parsedLinks = JSON.parse(links);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid links format' });
      }
    }

    const updatedLiveLink = await LiveLink.findByIdAndUpdate(
      req.params.id,
      {
        title: title || liveLink.title,
        description: description || liveLink.description,
        image: imageData,
        links: parsedLinks || liveLink.links,
        isActive: isActive !== undefined ? isActive : liveLink.isActive
      },
      { new: true, runValidators: true }
    );

    res.json(updatedLiveLink);
  } catch (error) {
    console.error('Error updating live link:', error);
    res.status(500).json({ message: 'Server error while updating live link' });
  }
});

// @desc    Delete live link
// @route   DELETE /api/livelinks/:id
// @access  Public (no auth check)
const deleteLiveLink = asyncHandler(async (req, res) => {
  try {
    const liveLink = await LiveLink.findById(req.params.id);
    
    if (!liveLink) {
      return res.status(404).json({ message: 'Live link not found' });
    }

    // Delete image from Cloudinary
    if (liveLink.image && liveLink.image.publicId) {
      await cloudinary.uploader.destroy(liveLink.image.publicId);
    }

    await liveLink.deleteOne();

    res.json({ message: 'Live link removed successfully' });
  } catch (error) {
    console.error('Error deleting live link:', error);
    res.status(500).json({ message: 'Server error while deleting live link' });
  }
});

// @desc    Get ALL live links (no user filter)
// @route   GET /api/livelinks/admin/my-links
// @access  Public
const getMyLiveLinks = asyncHandler(async (req, res) => {
  try {
    const liveLinks = await LiveLink.find()
      .sort({ createdAt: -1 });

    res.json(liveLinks);
  } catch (error) {
    console.error('Error fetching admin live links:', error);
    res.status(500).json({ message: 'Server error while fetching admin live links' });
  }
});

module.exports = {
  createLiveLink,
  getLiveLinks,
  getLiveLink,
  updateLiveLink,
  deleteLiveLink,
  getMyLiveLinks
};
