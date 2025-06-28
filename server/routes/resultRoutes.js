const express = require('express');
const router = express.Router();
const {
  getWinners,
  getWinnerById,
  createWinner,
  addTrophy,
  updateTrophy,
  deleteTrophy,
  deleteWinner
} = require('../controllers/winnerController');

// GET /api/winners - Get all players
router.get('/', getWinners);

// GET /api/winners/:id - Get one player
router.get('/:id', getWinnerById);

// POST /api/winners - Create a player with trophies
router.post('/', createWinner);

// POST /api/winners/:id/trophies - Add trophy to a player
router.post('/:id/trophies', addTrophy);

// PUT /api/winners/:id/trophies - Update trophy count
router.put('/:id/trophies', updateTrophy);

// DELETE /api/winners/:id/trophies - Remove a specific trophy
router.delete('/:id/trophies', deleteTrophy);

// DELETE /api/winners/:id - Delete player
router.delete('/:id', deleteWinner);

module.exports = router;
