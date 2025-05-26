  const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
  competitionName: {
    type: String,
    required: true,
    trim: true
  },
  winnerName: {
    type: String,
    required: true,
    trim: true
  },
  season: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  prize: {
    type: Number,
    required: true
  },
  runnerUp: {
    type: String,
    trim: true
  },
  description: String
}, { timestamps: true });
  module.exports = mongoose.model('Winner', winnerSchema);
