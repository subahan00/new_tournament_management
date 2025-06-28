const mongoose = require('mongoose');

const trophySchema = new mongoose.Schema({
  competition: {
    type: String,
    required: [true, 'Competition name is required'],
    trim: true
  },
  timesWon: {
    type: Number,
    required: [true, 'Times won is required'],
    min: [1, 'Times won must be at least 1'],
    default: 1
  }
}, { _id: false });

const winnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Player name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  trophies: {
    type: [trophySchema],
    default: []
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field to calculate total trophy count
winnerSchema.virtual('totalTrophies').get(function() {
  return this.trophies.reduce((total, trophy) => total + trophy.timesWon, 0);
});

// Index for better query performance
winnerSchema.index({ name: 1 });

// Pre-save middleware to validate trophies
winnerSchema.pre('save', function(next) {
  // Remove duplicate competitions, keeping the one with highest timesWon
  const competitionMap = new Map();
  
  this.trophies.forEach(trophy => {
    const existing = competitionMap.get(trophy.competition);
    if (!existing || trophy.timesWon > existing.timesWon) {
      competitionMap.set(trophy.competition, trophy);
    }
  });
  
  this.trophies = Array.from(competitionMap.values());
  next();
});

module.exports = mongoose.model('Winner', winnerSchema);
