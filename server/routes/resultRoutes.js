const express = require('express');
const router = express.Router();
const Winner=require('../models/Winner'); // Adjust path as needed
router.post('/', async (req, res) => {
  try {
    const winner = new Winner(req.body);
    await winner.save();
    res.status(201).json(winner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all winners (if needed)
router.get('/', async (req, res) => {
  try {
    const winners = await Winner.find().sort({ date: -1 });
    res.json(winners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;    
