//playerRoutes
const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

// Get all players
router.get('/', async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch players' });
  }
});

// Create a new player
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    const newPlayer = new Player({ name }); // 👈 no competitionId
    await newPlayer.save();

    res.status(201).json(newPlayer);
  } catch (error) {
    console.error('Player creation error:', error);
    res.status(400).json({ error: 'Failed to create player' });
  }
});


// Delete a player
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Player.findByIdAndDelete(id);
    res.status(200).json({ message: 'Player deleted' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to delete player' });
  }
});

module.exports = router;
