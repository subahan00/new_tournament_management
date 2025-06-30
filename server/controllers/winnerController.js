const Winner = require('../models/Winner');

// GET /winners - Get all players
const getWinners = async (req, res) => {
  try {
    const winners = await Winner.find({}).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: winners.length,
      data: winners
    });
  } catch (error) {
    console.error('Error fetching winners:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching winners'
    });
  }
};

// GET /winners/:id - Get one player
const getWinnerById = async (req, res) => {
  try {
    const { id } = req.params;

    const winner = await Winner.findById(id);
    
    if (!winner) {
      return res.status(404).json({
        success: false,
        error: 'Winner not found'
      });
    }

    res.status(200).json({
      success: true,
      data: winner
    });
  } catch (error) {
    console.error('Error fetching winner:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid winner ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while fetching winner'
    });
  }
};

// POST /winners - Create a player with trophies
const createWinner = async (req, res) => {
  try {
    const { name, trophies = [] } = req.body;

    // Check if winner already exists
    const existingWinner = await Winner.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingWinner) {
      return res.status(409).json({
        success: false,
        error: 'A player with this name already exists'
      });
    }

    const winner = await Winner.create({ name, trophies });
    
    res.status(201).json({
      success: true,
      data: winner,
      message: 'Winner created successfully'
    });
  } catch (error) {
    console.error('Error creating winner:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while creating winner'
    });
  }
};

// POST /winners/:id/trophies - Add trophy to a player
const addTrophy = async (req, res) => {
  try {
    const { id } = req.params;
    const { competition, timesWon = 1 } = req.body;

    if (!competition) {
      return res.status(400).json({
        success: false,
        error: 'Competition name is required'
      });
    }

    const winner = await Winner.findById(id);
    
    if (!winner) {
      return res.status(404).json({
        success: false,
        error: 'Winner not found'
      });
    }

    // Check if trophy already exists
    const existingTrophyIndex = winner.trophies.findIndex(
      trophy => trophy.competition.toLowerCase() === competition.toLowerCase()
    );

    if (existingTrophyIndex !== -1) {
      // Update existing trophy
      winner.trophies[existingTrophyIndex].timesWon += parseInt(timesWon);
    } else {
      // Add new trophy
      winner.trophies.push({ competition, timesWon: parseInt(timesWon) });
    }

    await winner.save();

    res.status(200).json({
      success: true,
      data: winner,
      message: 'Trophy added successfully'
    });
  } catch (error) {
    console.error('Error adding trophy:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid winner ID format'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while adding trophy'
    });
  }
};

// PUT /winners/:id/trophies - Update trophy count
const updateTrophy = async (req, res) => {
  try {
    console.log("🛠️ Backend hit: PUT /api/winners/:id/trophies");
    console.log("🛠️ Params:", req.params);
    console.log("🛠️ Body:", req.body);

    const { id } = req.params;
    const { competition, newCompetition, timesWon } = req.body;

    if (!competition || !newCompetition || !timesWon) {
      return res.status(400).json({
        success: false,
        error: 'Original competition name, new name, and times won are required'
      });
    }

    const winner = await Winner.findById(id);

    if (!winner) {
      return res.status(404).json({
        success: false,
        error: 'Winner not found'
      });
    }

    const trophyIndex = winner.trophies.findIndex(
      trophy => trophy.competition.trim().toLowerCase() === competition.trim().toLowerCase()
    );

    if (trophyIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Trophy not found for this winner'
      });
    }

    // ✅ Update name + timesWon
    winner.trophies[trophyIndex].competition = newCompetition.trim();
    winner.trophies[trophyIndex].timesWon = parseInt(timesWon);

    await winner.save();

    res.status(200).json({
      success: true,
      data: winner,
      message: 'Trophy updated (name and count)'
    });
  } catch (error) {
    console.error('Error updating trophy:', error);

    res.status(500).json({
      success: false,
      error: 'Server error while updating trophy'
    });
  }
};


// DELETE /winners/:id/trophies - Remove a specific trophy
const deleteTrophy = async (req, res) => {
  try {
    const { id } = req.params;
    const { competition } = req.body;

    if (!competition) {
      return res.status(400).json({
        success: false,
        error: 'Competition name is required'
      });
    }

    const winner = await Winner.findById(id);
    
    if (!winner) {
      return res.status(404).json({
        success: false,
        error: 'Winner not found'
      });
    }

    const initialLength = winner.trophies.length;
    winner.trophies = winner.trophies.filter(
      trophy => trophy.competition.toLowerCase() !== competition.toLowerCase()
    );

    if (winner.trophies.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: 'Trophy not found for this winner'
      });
    }

    await winner.save();

    res.status(200).json({
      success: true,
      data: winner,
      message: 'Trophy deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting trophy:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid winner ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while deleting trophy'
    });
  }
};

// DELETE /winners/:id - Delete player
const deleteWinner = async (req, res) => {
  try {
    const { id } = req.params;

    const winner = await Winner.findByIdAndDelete(id);
    
    if (!winner) {
      return res.status(404).json({
        success: false,
        error: 'Winner not found'
      });
    }

    res.status(200).json({
      success: true,
      data: winner,
      message: 'Winner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting winner:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid winner ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while deleting winner'
    });
  }
};

module.exports = {
  getWinners,
  getWinnerById,
  createWinner,
  addTrophy,
  updateTrophy,
  deleteTrophy,
  deleteWinner
};
