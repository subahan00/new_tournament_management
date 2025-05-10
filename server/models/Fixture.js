  const mongoose = require('mongoose');

  // Your competition schema and model code here


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
  awayPlayer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Player',
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

// Add validation
fixtureSchema.pre('save', function(next) {
  if (this.status === 'completed' && (this.homeScore === null || this.awayScore === null)) {
    throw new Error('Completed matches must have scores');
  }
  next();
});


  

  module.exports = mongoose.model('Fixture', fixtureSchema);
