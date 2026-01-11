// models/Standing.js (Updated with Soft Delete)
const mongoose = require('mongoose');

const standingSchema = new mongoose.Schema({
  competition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: true
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  playerName: {
    type: String,
    required: true
  },
  group: {
    type: String,
    default: null
  },
  matchesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  goalsFor: { type: Number, default: 0 },
  goalsAgainst: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  
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
});

// Middleware to exclude deleted items from normal queries
standingSchema.pre(/^find/, function(next) {
  if (!this.getQuery().isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('Standings', standingSchema);