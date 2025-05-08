const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  }, // Custom name (e.g., "KO Club Night")
  
  type: {
    type: String,
    enum: [
      'KO_REGULAR',
      'KO_CLUBS',
      'KO_BASE',
      'ELITE_LEAGUE', 
      'PRO_LEAGUE',
      'SUPER_LEAGUE',
      'ROOKIE_LEAGUE',
      'FRIENDLY_LEAGUE',
      'GNG',
      'NEW_TYPE' // Example for future types
    ],
    required: true
  },

  numberOfPlayers: { 
    type: Number, 
    required: true 
  },

  knockoutQualifiedCount: {
    type: Number,
    default: null // Only applicable to 'GNG' (mixed) or other future mixed types
  },

  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],

  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed'],
    default: 'upcoming'
  }

}, { timestamps: true });

module.exports = mongoose.model('Competition', competitionSchema);
