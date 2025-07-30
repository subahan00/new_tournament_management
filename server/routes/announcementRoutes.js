const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
} = require('../controllers/announcementController');

// Define routes
// GET /api/announcements - Fetches all announcements
router.get('/', getAnnouncements);

// POST /api/announcements - Creates a new announcement
router.post('/', createAnnouncement);

// DELETE /api/announcements/:id - Deletes a specific announcement
router.delete('/:id', deleteAnnouncement);

module.exports = router;
