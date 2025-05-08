const Competition = require('../models/Competition');
const Player = require('../models/Player');

const createCompetition = async (req, res) => {
  try {
    const { name, type, numberOfPlayers, players, knockoutQualifiedCount } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required'
      });
    }

    const KO_TYPES = ['KO_REGULAR', 'KO_CLUBS', 'KO_BASE'];
    const LEAGUE_TYPES = [
      'ELITE_LEAGUE',
      'PRO_LEAGUE',
      'SUPER_LEAGUE',
      'ROOKIE_LEAGUE',
      'FRIENDLY_LEAGUE'
    ];

    let finalNumberOfPlayers = numberOfPlayers;
    let finalKOCount = null;

    // Knockout validation
    if (KO_TYPES.includes(type)) {
      const allowedSizes = [8, 16, 32, 64];
      if (!finalNumberOfPlayers || !allowedSizes.includes(finalNumberOfPlayers)) {
        return res.status(400).json({
          success: false,
          message: 'KO tournaments must have 8, 16, 32, or 64 players'
        });
      }
    }

    // League default
    else if (LEAGUE_TYPES.includes(type)) {
      finalNumberOfPlayers = finalNumberOfPlayers || 20;
    }

    // Mixed (GNG) logic
    else if (type === 'GNG') {
      finalNumberOfPlayers = 25;
      if (numberOfPlayers && numberOfPlayers !== 25) {
        return res.status(400).json({
          success: false,
          message: 'GNG must have exactly 25 players'
        });
      }
      if (!knockoutQualifiedCount || knockoutQualifiedCount >= 25) {
        return res.status(400).json({
          success: false,
          message: 'GNG must have a knockoutQualifiedCount less than 25'
        });
      }
      finalKOCount = knockoutQualifiedCount;
    }

    // Create competition
    const competition = new Competition({
      name,
      type,
      numberOfPlayers: finalNumberOfPlayers,
      knockoutQualifiedCount: finalKOCount
    });

    // Handle players
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
