const Competition = require('../models/Competition');
const Player = require('../models/Player');

const createCompetition = async (req, res) => {
  try {
    const { name, type, numberOfPlayers, players } = req.body;

    // Validation
    if (!name || !type || !numberOfPlayers) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, type and numberOfPlayers are required' 
      });
    }

    // Create competition first
    const competition = new Competition({ 
      name, 
      type, 
      numberOfPlayers 
    });

    // If players array provide
    if (players && Array.isArray(players)) {
      const playerDocs = await Player.insertMany(
        players.map(name => ({
          name,
          competitionId: competition._id
        }))
      );
      competition.players = playerDocs.map(p => p._id);
    }

    await competition.save();

    return res.status(201).json({
      success: true,
      data: await Competition.findById(competition._id).populate('players')
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: err.message 
    });
  }
};

const getAllCompetitions = async (req, res) => {
  try {
    const competitions = await Competition.find()
      .populate('players')
      .lean();

    return res.status(200).json({ 
      success: true,
      count: competitions.length,
      data: competitions
    });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

const deleteCompetition = async (req, res) => {
  try {
    const competition = await Competition.findByIdAndDelete(req.params.id);
    
    if (!competition) {
      return res.status(404).json({ 
        success: false,
        message: 'Competition not found' 
      });
    }

    // Clean up related players
    await Player.deleteMany({ competitionId: competition._id });

    return res.status(200).json({ 
      success: true,
      message: 'Competition deleted'
    });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

module.exports = {
  createCompetition,
  getAllCompetitions,
  deleteCompetition
};