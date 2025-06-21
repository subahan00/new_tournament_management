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
      'NEW_TYPE',
      'LEAGUE',
      // Example for future types
    ],
    required: true
  },

  numberOfPlayers: { 
    type: Number, 
    required: true 
  },
  rounds:{
    type:Number,
    default: 3
  },
  knockoutQualifiedCount: {
    type: Number,
    default: null // Only applicable to 'GNG' (mixed) or other future mixed types
  },

  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  currentRound: {
    index: { type: Number, default: 0 },
    name: String
  },
    totalRounds: Number,

  isCompleted: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed'],
    default: 'upcoming'
  },
    winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  }

}, { timestamps: true });
// In your Competition model schema
competitionSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'completed') {
    try {
      // Delete all associated fixtures
      await mongoose.model('Fixture').deleteMany({ competitionId: this._id });
      console.log(`Deleted fixtures for completed competition: ${this.name}`);
    } catch (err) {
      return next(err);
    }
  }
  next();
}); 

module.exports = mongoose.model('Competition', competitionSchema);
