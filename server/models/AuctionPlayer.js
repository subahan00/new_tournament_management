// models/AuctionPlayer.js
const mongoose = require('mongoose');

const auctionPlayerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  position: {
    type: String,
    enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 100,
    required: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentPrice: {
    type: Number,
    default: function() { return this.basePrice; }
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
    ref: 'Bidder',
    default: null
  },
  imageUrl: String // Optional player image
}, { timestamps: true });

module.exports = mongoose.model('AuctionPlayer', auctionPlayerSchema);
