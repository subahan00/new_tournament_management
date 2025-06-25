here are the schema of standings add indexes for fast data retrieving:here is the schema add indexing:  const mongoose = require('mongoose');

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
    default: null // Will be null for non-group competitions, group name for GROUP_STAGE
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
