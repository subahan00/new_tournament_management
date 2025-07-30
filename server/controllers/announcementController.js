const Announcement = require('../models/Announcement');

/**
 * @desc    Get all announcements
 * @route   GET /api/announcements
 * @access  Public
 */
exports.getAnnouncements = async (req, res) => {
    try {
        // Find all announcements and sort them by creation date in descending order (newest first)
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: announcements.length,
            data: announcements,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: Could not fetch announcements.' });
    }
};

/**
 * @desc    Create a new announcement
 * @route   POST /api/announcements
 * @access  Private (assumed to be protected for admins)
 */
exports.createAnnouncement = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, error: 'Please provide announcement text.' });
        }

        const announcement = await Announcement.create({ text });

        res.status(201).json({
            success: true,
            data: announcement,
        });
    } catch (error) {
        // Handle potential validation errors from Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages });
        }
        res.status(500).json({ success: false, error: 'Server Error: Could not create announcement.' });
    }
};

/**
 * @desc    Delete an announcement
 * @route   DELETE /api/announcements/:id
 * @access  Private (assumed to be protected for admins)
 */
exports.deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ success: false, error: 'No announcement found with that ID.' });
        }

        await announcement.deleteOne(); // Use deleteOne() on the document

        res.status(200).json({
            success: true,
            data: {}, // Return empty object on successful deletion
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: Could not delete announcement.' });
    }
};
