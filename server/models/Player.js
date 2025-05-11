const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  competitionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Competition'  }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
