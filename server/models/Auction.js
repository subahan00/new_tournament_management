// models/Auction.js
const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: String,
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed'],
    default: 'draft'
  },
  totalBudget: {
    type: Number,
    default: 1000000 // Default budget for each bidder
  },
  currentPlayerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionPlayer',
    default: null
  },
  currentPlayerIndex: {
    type: Number,
    default: 0
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Auction', auctionSchema);