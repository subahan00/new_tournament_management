  const mongoose = require('mongoose');

  // Your competition schema and model code here


  const fixtureSchema = new mongoose.Schema({
    competitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition', required: true },
    round: String, // Could be "Match 1", "Match 2", etc.
    homePlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    awayPlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    matchDate: Date, // Optional, can be filled later
    resultEntered: { type: Boolean, default: false }
  }, { timestamps: true });
  

  module.exports = mongoose.model('Fixture', fixtureSchema);
