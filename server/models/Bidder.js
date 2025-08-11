// models/Bidder.js
const mongoose = require('mongoose');

const bidderSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  teamName: {
    type: String,
    required: true
  },
  socketId: String,
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'inactive'],
    default: 'pending'
  },
  totalBudget: {
    type: Number,
    required: true
  },
  remainingBudget: {
    type: Number,
    required: true
  },
  playersWon: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionPlayer'
  }],
  isOnline: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Bidder', bidderSchema);
