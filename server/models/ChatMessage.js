// models/ChatMessage.js
const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    maxLength: 500
  },
  senderName: {
    type: String,
    required: true
  },
  senderType: {
    type: String,
    enum: ['admin', 'bidder', 'viewer'],
    required: true
  },
  senderId: {
    type: String, // Could be bidder ID or socket ID for viewers
    required: true
  },
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);