const mongoose = require('mongoose');

// Your competition schema and model code here


const resultSchema = new mongoose.Schema({
  fixtureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fixture', required: true },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  homeScore: Number,
  awayScore: N555umber
}, { timestamps: true });
module.exports =mongoose.model('Result', resultSchema);
