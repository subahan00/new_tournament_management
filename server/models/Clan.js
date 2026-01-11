// models/Clan.js (Updated with Soft Delete)
const mongoose = require('mongoose');

const clanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  competitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: false,
    default: null
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  }],
  points: {
    type: Number,
    default: 0
  },
  matchesWon: {
    type: Number,
    default: 0
  },
  matchesDrawn: {
    type: Number,
    default: 0
  },
  matchesLost: {
    type: Number,
    default: 0
  },
  isEliminated: {
    type: Boolean,
    default: false
  },
  
  // Soft Delete Fields
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Validation to ensure exactly 5 members per clan
clanSchema.pre('save', function(next) {
  if (this.members.length !== 5) {
    return next(new Error('Each clan must have exactly 5 members'));
  }
  next();
});

// Middleware to exclude deleted items from normal queries
clanSchema.pre(/^find/, function(next) {
  if (!this.getQuery().isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Index for better query performance
clanSchema.index({ competitionId: 1 });
clanSchema.index({ competitionId: 1, isEliminated: 1 });
clanSchema.index({ points: -1 });
clanSchema.index({ name: 1 });

module.exports = mongoose.model('Clan', clanSchema);