const Competition = require('../models/Competition');
const Player = require('../models/Player');

// Create a new competition
const createCompetition = async (req, res) => {
  try {
    const {
      name,
      type,              // 'knockout', 'league', or 'mixed'
      numberOfPlayers,
      players            // Array of player names
    } = req.body;

    // Validate input
    if (!name || !type || !numberOfPlayers || !Array.isArray(players)) {
      return res.status(400).json({ message: 'Missing or invalid competition data' });
    }

    if (players.length !== numberOfPlayers) {
      return res.status(400).json({ message: 'Number of players does not match the provided player list' });
    }

    // Create new competition
    const competition = new Competition({
      name,
      type,
      numberOfPlayers,
      players: [], // to be populated below
    });

    // Save competition first to get its ID
    await competition.save();

    // Create player documents and associate them with this competition
    const playerDocs = await Player.insertMany(
      players.map(playerName => ({
        name: playerName,
        competitionId: competition._id
      }))
    );

    // Update competition with created players
    competition.players = playerDocs.map(player => player._id);
    await competition.save();

    return res.status(201).json({
      message: 'Competition created successfully',
      competition
    });

  } catch (err) {
    console.error('Error creating competition:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
// Delete a competition by ID
const deleteCompetition = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find competition
      const competition = await Competition.findById(id);
      if (!competition) {
        return res.status(404).json({ message: 'Competition not found' });
      }
  
      // Delete associated players
      await Player.deleteMany({ competitionId: id });
  
      // TODO: Also delete fixtures and results if needed later
  
      // Delete the competition itself
      await Competition.findByIdAndDelete(id);
  
      return res.status(200).json({ message: 'Competition deleted successfully' });
  
    } catch (err) {
      console.error('Error deleting competition:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  };
  console.log(createCompetition); // Add this line before module.exports

  module.exports = {
    createCompetition,
    deleteCompetition
  };
    