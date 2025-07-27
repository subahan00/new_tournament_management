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
    },
});

const Announcement = mongoose.model('Announcement', AnnouncementSchema);

module.exports = Announcement; // ✅ Add this line!
