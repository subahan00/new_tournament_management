const mongoose = require('mongoose');

const fixtureSchema = new mongoose.Schema({
  competitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: true
  },
  round: String,
homePlayer: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Player',
  required: true
},
homePlayerName: {
  type: String,
  required: true
},
awayPlayer: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Player',
  required: true
},
awayPlayerName: {
  type: String,
  required: true
},
  matchDate: {
    type: Date,
    default: Date.now
  },
  homeScore: {
    type: Number,
    min: 0,
    default: null
  },
  awayScore: {
    type: Number,
    min: 0,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  result: {
    type: String,
    enum: ['home', 'away', 'draw', null],
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Validation for player-competition relationship
fixtureSchema.pre('save', async function (next) {
  const Competition = mongoose.model('Competition');

  // Check if both players belong to the competition
  const competition = await Competition.findOne({
    _id: this.competitionId,
    players: { $all: [this.homePlayer, this.awayPlayer] }
  });

  if (!competition) {
    throw new Error('One or both players do not belong to this competition');
  }

  // Score validation
  if (this.status === 'completed' && (this.homeScore === null || this.awayScore === null)) {
    throw new Error('Completed matches must have scores');
  }

  // Prevent duplicate fixtures
  const existingFixture = await mongoose.model('Fixture').findOne({
    competitionId: this.competitionId,
    $or: [
      { homePlayer: this.homePlayer, awayPlayer: this.awayPlayer },
      { homePlayer: this.awayPlayer, awayPlayer: this.homePlayer }
    ]
  });

  if (existingFixture && !existingFixture._id.equals(this._id)) {
    throw new Error('Fixture between these players already exists in this competition');
  }

  next();
});

// Indexes for faster querying
fixtureSchema.index({ competitionId: 1, status: 1 });
fixtureSchema.index({ homePlayer: 1, awayPlayer: 1 });

module.exports = mongoose.model('Fixture', fixtureSchema);