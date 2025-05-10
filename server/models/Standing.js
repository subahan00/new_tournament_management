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
  matchesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  goalsFor: { type: Number, default: 0 },
  goalsAgainst: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Standings', standingSchema);