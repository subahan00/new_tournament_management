const mongoose = require('mongoose');

// Your competition schema and model code here


const competitionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  knockoutQualifiedCount: {
    type: Number,
    default: null // e.g., 16 if top 16 go to knockout
  }
,  
  type: { type: String, enum: ['knockout', 'league', 'mixed'], required: true },
  numberOfPlayers: { type: Number, required: true },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' }
}, { timestamps: true },);

module.exports =mongoose.model('Competition', competitionSchema);
