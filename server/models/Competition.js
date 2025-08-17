// models/Competition.js (Updated)
const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
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
      'GROUP_STAGE',
      'LEAGUE',
      'CLAN_WAR' // New type added
    ],
    required: true
  },
  numberOfPlayers: {
    type: Number,
    required: true
  },
  // New fields for CLAN_WAR type
  numberOfClans: {
    type: Number,
    required: function() {
      return this.type === 'CLAN_WAR';
    }
  },
  clans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clan'
  }],
  rounds: {
    type: Number,
    default: 3
  },
  knockoutQualifiedCount: {
    type: Number,
    default: null
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
  },
  // For CLAN_WAR, this will reference the winning clan
  winnerClan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clan',
    default: null
  }
}, { timestamps: true });

// Pre-save validation for CLAN_WAR
competitionSchema.pre('save', function(next) {
  if (this.type === 'CLAN_WAR') {
    // Validate numberOfPlayers is correct for clan war (numberOfClans * 5)
    if (this.numberOfPlayers !== this.numberOfClans * 5) {
      return next(new Error('For CLAN_WAR, numberOfPlayers must equal numberOfClans * 5'));
    }
    
    // Ensure numberOfClans is power of 2 for proper knockout format
    if (this.numberOfClans && !isPowerOfTwo(this.numberOfClans)) {
      return next(new Error('Number of clans must be a power of 2 (2, 4, 8, 16, etc.)'));
    }
  }
  next();
});

// Delete associated fixtures and clans when competition is completed
competitionSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'completed') {
    try {
      // Delete all associated fixtures
      await mongoose.model('Fixture').deleteMany({ competitionId: this._id });
      
      // For CLAN_WAR, also delete associated clans
      if (this.type === 'CLAN_WAR') {
        await mongoose.model('Clan').deleteMany({ competitionId: this._id });
      }
      
      console.log(`Deleted fixtures and clans for completed competition: ${this.name}`);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Helper function to check if number is power of 2
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

module.exports = mongoose.model('Competition', competitionSchema);