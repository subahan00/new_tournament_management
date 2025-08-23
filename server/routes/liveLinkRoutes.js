const express = require('express');
const multer = require('multer');
const {
  createLiveLink,
  getLiveLinks,
  getLiveLink,
  updateLiveLink,
  deleteLiveLink,
  getMyLiveLinks
} = require('../controllers/liveLinkController');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Public routes
router.route('/')
  .get(getLiveLinks)
  .post( upload.single('image'), createLiveLink);

// Admin routes
router.route('/admin/my-links')
  .get( getMyLiveLinks);

// Individual live link routes
router.route('/:id')
  .get(getLiveLink)
  .put( upload.single('image'), updateLiveLink)
  .delete( deleteLiveLink);

module.exports = router;