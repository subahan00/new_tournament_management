// models/Fixture.js (Updated)
const mongoose = require('mongoose');

const fixtureSchema = new mongoose.Schema({
  competitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: true
  },
  round: String,
  
  // For regular tournaments
  homePlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: function() {
      return !this.isClanWar;
    }
  },
  homePlayerName: {
    type: String,
    required: function() {
      return !this.isClanWar;
    }
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
  
  // For CLAN_WAR tournaments
  isClanWar: {
    type: Boolean,
    default: false
  },
  homeClan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clan',
    required: function() {
      return this.isClanWar;
    }
  },
  awayClan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clan',
    required: function() {
      return this.isClanWar;
    }
  },
  
  // Individual matches within clan war (5 matches per clan war)
  individualMatches: [{
    homePlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true
    },
    awayPlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true
    },
    homePlayerName: String,
    awayPlayerName: String,
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
    result: {
      type: String,
      enum: ['home', 'away', 'draw', null],
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
    }
  }],
  
  // Clan war specific scoring
  homeClanPoints: {
    type: Number,
    default: 0,
    required: function() {
      return this.isClanWar;
    }
  },
  awayClanPoints: {
    type: Number,
    default: 0,
    required: function() {
      return this.isClanWar;
    }
  },
  
  matchDate: {
    type: Date,
    default: Date.now
  },
  
  // For regular matches
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

// Pre-save validation
fixtureSchema.pre('save', async function (next) {
  const Competition = mongoose.model('Competition');
  const Fixture = mongoose.model('Fixture');

  if (this.isClanWar) {
    // Validate clan war fixture
    const competition = await Competition.findOne({
      _id: this.competitionId,
      type: 'CLAN_WAR',
      clans: { $all: [this.homeClan, this.awayClan] }
    });

    if (!competition) {
      throw new Error('One or both clans do not belong to this CLAN_WAR competition');
    }

    // Validate individual matches have exactly 5 matches
    if (this.individualMatches && this.individualMatches.length !== 5) {
      throw new Error('Clan war must have exactly 5 individual matches');
    }

    // Calculate clan points if all individual matches are completed
    if (this.individualMatches && this.individualMatches.length === 5) {
      const allCompleted = this.individualMatches.every(match => match.status === 'completed');
      if (allCompleted) {
        this.homeClanPoints = 0;
        this.awayClanPoints = 0;
        
        this.individualMatches.forEach(match => {
          if (match.result === 'home') {
            this.homeClanPoints += 3;
          } else if (match.result === 'away') {
            this.awayClanPoints += 3;
          } else if (match.result === 'draw') {
            this.homeClanPoints += 1;
            this.awayClanPoints += 1;
          }
        });
        
        // Determine overall result
        if (this.homeClanPoints > this.awayClanPoints) {
          this.result = 'home';
        } else if (this.awayClanPoints > this.homeClanPoints) {
          this.result = 'away';
        } else {
          this.result = 'draw';
        }
        
        this.status = 'completed';
      }
    }
  } else {
    // Existing validation for regular tournaments
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
  }

  next();
});

// Indexes
fixtureSchema.index({ competitionId: 1 });
fixtureSchema.index({ competitionId: 1, status: 1 });
fixtureSchema.index({ competitionId: 1, round: 1 });
fixtureSchema.index({ competitionId: 1, isClanWar: 1 });
fixtureSchema.index({ homeClan: 1 });
fixtureSchema.index({ awayClan: 1 });

module.exports = mongoose.model('Fixture', fixtureSchema);