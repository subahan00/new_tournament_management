// routes/auctionRoutes.js
const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction');
const AuctionPlayer = require('../models/AuctionPlayer');
const Bidder = require('../models/Bidder');
const Bid = require('../models/Bid');
const ChatMessage = require('../models/ChatMessage');
const { authenticate } = require('../utils/middlewares');

// GET all auctions (public)
router.get('/', async (req, res) => {
  try {
    const auctions = await Auction.find()
      .populate('adminId', 'username')
      .select('-__v')
      .sort({ createdAt: -1 });
    res.json(auctions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single auction details (public)
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('adminId', 'username')
      .populate('currentPlayerId');
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    const players = await AuctionPlayer.find({ auctionId: req.params.id });
    const bidders = await Bidder.find({ auctionId: req.params.id, status: 'approved' })
      .populate('playersWon');

    res.json({
      auction,
      players,
      bidders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE new auction (admin only)
// This route is updated to handle the new player model structure
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, totalBudget, players } = req.body;

    const auction = new Auction({
      name,
      description,
      totalBudget: totalBudget || 1000000,
      adminId: req.user.id
    });

    await auction.save();

    // Create auction players with the new eFootball-specific fields
    if (players && players.length > 0) {
      const auctionPlayers = players.map(player => ({
        name: player.name,
        trophiesWon: player.trophiesWon,
        division1ReachedCount: player.division1ReachedCount,
        basePrice: player.basePrice,
        auctionId: auction._id,
      }));
      
      await AuctionPlayer.insertMany(auctionPlayers);
    }

    res.status(201).json(auction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE auction status (admin only)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const auction = await Auction.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    res.json(auction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET auction players
router.get('/:id/players', async (req, res) => {
  try {
    const players = await AuctionPlayer.find({ auctionId: req.params.id })
      .populate('soldTo', 'name teamName')
      .sort({ createdAt: 1 });
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADD players to auction (admin only)
// This route is also updated to handle the new player model
router.post('/:id/players', authenticate, async (req, res) => {
  try {
    const { players } = req.body;
    const auctionPlayers = players.map(player => ({
        name: player.name,
        trophiesWon: player.trophiesWon,
        division1ReachedCount: player.division1ReachedCount,
        basePrice: player.basePrice,
        auctionId: req.params.id,
    }));
    
    const createdPlayers = await AuctionPlayer.insertMany(auctionPlayers);
    res.status(201).json(createdPlayers);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET bidders for auction
router.get('/:id/bidders', async (req, res) => {
  try {
    const bidders = await Bidder.find({ auctionId: req.params.id })
      .populate('playersWon')
      .sort({ createdAt: 1 });
    res.json(bidders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// REQUEST to join as bidder
router.post('/:id/join-bidder', async (req, res) => {
  try {
    const { name, teamName } = req.body;
    const auctionId = req.params.id;

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Check if name/team already exists
    const existingBidder = await Bidder.findOne({
      auctionId,
      $or: [{ name }, { teamName }]
    });

    if (existingBidder) {
      return res.status(400).json({ message: 'Name or team name already taken' });
    }

    const bidder = new Bidder({
      name,
      teamName,
      auctionId,
      totalBudget: auction.totalBudget,
      remainingBudget: auction.totalBudget
    });

    await bidder.save();
    res.status(201).json(bidder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// APPROVE/REJECT bidder (admin only)
router.patch('/:id/bidders/:bidderId', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const bidder = await Bidder.findByIdAndUpdate(
      req.params.bidderId,
      { status },
      { new: true }
    );

    if (!bidder) {
      return res.status(404).json({ message: 'Bidder not found' });
    }

    res.json(bidder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET chat messages
router.get('/:id/chat', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ auctionId: req.params.id })
      .sort({ createdAt: 1 })
      .limit(100); // Last 100 messages
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE auction (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Delete related data
    await Promise.all([
      AuctionPlayer.deleteMany({ auctionId: req.params.id }),
      Bidder.deleteMany({ auctionId: req.params.id }),
      Bid.deleteMany({ auctionId: req.params.id }),
      ChatMessage.deleteMany({ auctionId: req.params.id })
    ]);

    await Auction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Auction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
