const mongoose = require('mongoose');

// Your competition schema and model code here


const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  competitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition', required: true }
}, { timestamps: true });

module.exports =mongoose.model('Player', playerSchema);
