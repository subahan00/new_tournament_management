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
    required: true,
  },
  playerName: {
    type: String,
    required: true
  },
  group: {
    type: String,
    default: null // Null for non-group competitions
  },
  matchesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  goalsFor: { type: Number, default: 0 },
  goalsAgainst: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

// Indexes for optimized queries
standingSchema.index({ competition: 1 }); // Single-field index for competition-only queries
standingSchema.index({ player: 1, competition: 1 }); // Fast player-specific standings in a competition
standingSchema.index({ 
  competition: 1, 
  group: 1, 
  points: -1, 
  goalsFor: -1 
}); // Sorted standings view (competition + group)

module.exports = mongoose.model('Standings', standingSchema);
