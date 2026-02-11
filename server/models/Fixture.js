const mongoose = require('mongoose');

const fixtureSchema = new mongoose.Schema({
  competitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition', required: true },
  round: String,
  
  // Regular tournaments
  homePlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: function() { return !this.isClanWar; } },
  homePlayerName: { type: String, required: function() { return !this.isClanWar; } },
  matchday: { type: Number, required: false, index: true },
  awayPlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: false, default: null },
  awayPlayerName: { type: String, required: false, default: 'BYE' },
  
  // CLAN_WAR tournaments
  isClanWar: { type: Boolean, default: false },
  homeClan: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: function() { return this.isClanWar; } },
  awayClan: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: function() { return this.isClanWar; } },
  
  individualMatches: [{
    homePlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    awayPlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    homePlayerName: String,
    awayPlayerName: String,
    homeScore: { type: Number, min: 0, default: null },
    awayScore: { type: Number, min: 0, default: null },
    result: { type: String, enum: ['home', 'away', 'draw', null], default: null },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' }
  }],
  
  homeClanPoints: { type: Number, default: 0, required: function() { return this.isClanWar; } },
  awayClanPoints: { type: Number, default: 0, required: function() { return this.isClanWar; } },
  
  matchDate: { type: Date, default: Date.now },
  
  homeScore: { type: Number, min: 0, default: null },
  awayScore: { type: Number, min: 0, default: null },
  
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  result: { type: String, enum: ['home', 'away', 'draw', null], default: null },
  bracketPosition: { type: Number, required: true, default: 0 },
  previousMatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Fixture', default: [] }],
  
  // Soft Delete
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- UPDATED PRE-SAVE HOOK ---
fixtureSchema.pre('save', async function (next) {
  const Competition = mongoose.model('Competition');
  const Fixture = mongoose.model('Fixture');

  // --- 1. CLAN WAR LOGIC ---
  if (this.isClanWar) {
    const competition = await Competition.findOne({
      _id: this.competitionId,
      type: 'CLAN_WAR',
      clans: { $all: [this.homeClan, this.awayClan] },
      isDeleted: false
    });

    if (!competition) throw new Error('One or both clans do not belong to this CLAN_WAR competition');
    if (this.individualMatches && this.individualMatches.length !== 5) throw new Error('Clan war must have exactly 5 individual matches');

    // Auto-calculate Clan War Status
    if (this.individualMatches && this.individualMatches.length === 5) {
      const allCompleted = this.individualMatches.every(match => match.status === 'completed');
      
      if (allCompleted) {
        // Calculate points
        this.homeClanPoints = 0;
        this.awayClanPoints = 0;
        
        this.individualMatches.forEach(match => {
          if (match.result === 'home') this.homeClanPoints += 3;
          else if (match.result === 'away') this.awayClanPoints += 3;
          else if (match.result === 'draw') {
            this.homeClanPoints += 1;
            this.awayClanPoints += 1;
          }
        });
        
        // Determine Winner
        if (this.homeClanPoints > this.awayClanPoints) this.result = 'home';
        else if (this.awayClanPoints > this.homeClanPoints) this.result = 'away';
        else this.result = 'draw';
        
        this.status = 'completed';
      } else {
        // If not all matches are done, force pending (Revert logic for Clan Wars)
        this.status = 'pending';
        this.result = null;
      }
    }
  } 
  
  // --- 2. REGULAR MATCH LOGIC ---
  else {
    const isBye = this.awayPlayer === null && this.awayPlayerName === 'BYE';

    if (!isBye) {
      const competition = await Competition.findOne({
        _id: this.competitionId,
        players: { $all: [this.homePlayer, this.awayPlayer] },
        isDeleted: false
      });

      if (!competition) throw new Error('One or both players do not belong to this competition');

      // --- NEW: AUTO-UPDATE STATUS & RESULT ---
      // If both scores are present, mark as completed
      if (this.homeScore !== null && this.homeScore !== undefined && 
          this.awayScore !== null && this.awayScore !== undefined) {
        
        this.status = 'completed';

        if (this.homeScore > this.awayScore) this.result = 'home';
        else if (this.awayScore > this.homeScore) this.result = 'away';
        else this.result = 'draw';
      
      } else {
        // If any score is missing (null), revert to pending
        this.status = 'pending';
        this.result = null;
      }

      // Check Duplicates (Only if it's a new record or players changed)
      if (this.isNew || this.isModified('homePlayer') || this.isModified('awayPlayer')) {
        const existingFixture = await Fixture.findOne({
            competitionId: this.competitionId,
            isDeleted: false,
            _id: { $ne: this._id }, // Exclude self
            $or: [
            { homePlayer: this.homePlayer, awayPlayer: this.awayPlayer },
            { homePlayer: this.awayPlayer, awayPlayer: this.homePlayer }
            ]
        });

        if (existingFixture) {
            throw new Error('Fixture between these players already exists in this competition');
        }
      }
    }
  }

  next();
});

// Middleware to exclude deleted items
fixtureSchema.pre(/^find/, function(next) {
  if (!this.getQuery().isDeleted) {
    this.where({ isDeleted: { $ne: true } });
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
