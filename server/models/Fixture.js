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
    required: false,
    default: null
  },
  awayPlayerName: {
    type: String,
    required: false,
    default: 'BYE'
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
  },
  bracketPosition: {
    type: Number,
    required: true,
    default: 0
  },
  previousMatches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fixture',
    default: []
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- Pre-Save Validation ---
fixtureSchema.pre('save', async function (next) {
  const Competition = mongoose.model('Competition');
  const Fixture = mongoose.model('Fixture');

  const isBye = this.awayPlayer === null && this.awayPlayerName === 'BYE';

  if (!isBye) {
    const competition = await Competition.findOne({
      _id: this.competitionId,
      players: { $all: [this.homePlayer, this.awayPlayer] }
    });

    if (!competition) {
      throw new Error('One or both players do not belong to this competition');
    }

    if (this.status === 'completed' && (this.homeScore === null || this.awayScore === null)) {
      throw new Error('Completed matches must have scores');
    }

    const existingFixture = await Fixture.findOne({
      competitionId: this.competitionId,
      $or: [
        { homePlayer: this.homePlayer, awayPlayer: this.awayPlayer },
        { homePlayer: this.awayPlayer, awayPlayer: this.homePlayer }
      ]
    });

    if (existingFixture && !existingFixture._id.equals(this._id)) {
      throw new Error('Fixture between these players already exists in this competition');
    }
  }

  next();
});

// --- Indexes for Optimized Queries ---
fixtureSchema.index({ competitionId: 1 });
fixtureSchema.index({ competitionId: 1, status: 1 });
fixtureSchema.index({ competitionId: 1, round: 1 });
fixtureSchema.index({ competitionId: 1, matchDate: 1 });
fixtureSchema.index({ homePlayer: 1, status: 1 });
fixtureSchema.index({ awayPlayer: 1, status: 1 });
fixtureSchema.index({ matchDate: -1 });

module.exports = mongoose.model('Fixture', fixtureSchema);
