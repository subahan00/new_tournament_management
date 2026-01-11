// models/Competition.js (Updated with Soft Delete)
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
      'GROUP_STAGE',
      'LEAGUE',
      'CLAN_WAR'
    ],
    required: true
  },
  numberOfPlayers: {
    type: Number,
    required: true
  },
  numberOfClans: {
    type: Number,
    required: function () {
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
  winnerClan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clan',
    default: null
  },

  // Soft Delete Fields
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: String, // Could be userId if you have authentication
    default: null
  },
  // Store snapshot of deleted data for recovery
  deletionSnapshot: {
    fixturesCount: { type: Number, default: 0 },
    standingsCount: { type: Number, default: 0 },
    clansCount: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Pre-save validation for CLAN_WAR
competitionSchema.pre('save', function (next) {
  if (this.type === 'CLAN_WAR') {
    if (this.numberOfPlayers !== this.numberOfClans * 5) {
      return next(new Error('For CLAN_WAR, numberOfPlayers must equal numberOfClans * 5'));
    }

    if (this.numberOfClans && !isPowerOfTwo(this.numberOfClans)) {
      return next(new Error('Number of clans must be a power of 2 (2, 4, 8, 16, etc.)'));
    }
  }
  next();
});

// Middleware to exclude deleted items from normal queries
competitionSchema.pre(/^find/, function (next) {
  const query = this.getQuery();

  // If query explicitly asks for deleted or non-deleted, don't override
  if (
    Object.prototype.hasOwnProperty.call(query, 'isDeleted')
  ) {
    return next();
  }

  // Default: exclude deleted
  this.where({ isDeleted: false });
  next();
});


// Helper function to check if number is power of 2
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

// Instance method to soft delete
competitionSchema.methods.softDelete = async function (userId = null) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return await this.save();
};

// Instance method to restore
competitionSchema.methods.restore = async function () {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  return await this.save();
};

// Static method to find deleted competitions
competitionSchema.statics.findDeleted = function (conditions = {}) {
  return this.find({ ...conditions, isDeleted: true }).sort({ deletedAt: -1 });
};

module.exports = mongoose.model('Competition', competitionSchema);