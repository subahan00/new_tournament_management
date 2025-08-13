// models/AuctionPlayer.js
const mongoose = require('mongoose');

const auctionPlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  trophiesWon: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  division1ReachedCount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  soldPrice: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['available', 'bidding', 'sold', 'unsold'],
    default: 'available'
  },
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true
  },
  soldTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bidder', // Reverted back to 'Bidder' as per your original code
    default: null
  }
});

module.exports = mongoose.model('AuctionPlayer', auctionPlayerSchema);