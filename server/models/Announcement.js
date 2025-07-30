const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Announcement text cannot be empty.'],
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // This tells MongoDB to automatically delete documents after 1 week (7 days)
        // 60 seconds * 60 minutes * 24 hours * 7 days = 604800 seconds
        expires: 604800, 
    },
});

const Announcement = mongoose.model('Announcement', AnnouncementSchema);

module.exports = Announcement;
