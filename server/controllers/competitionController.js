const Competition = require('../models/Competition');
const Player = require('../models/Player');
const mongoose = require('mongoose');

const competitionController = {
  createCompetition: async (req, res) => {
    try {
      const { name, type, numberOfPlayers, players, knockoutQualifiedCount } = req.body;

      // Basic validation
      if (!name || !type) {
        return res.status(400).json({
          success: false,
          message: 'Name and type are required fields'
        });
      }

      // Initialize competition parameters
      const competitionData = {
        name,
        type,
        numberOfPlayers: numberOfPlayers || 0,
        players: []
      };

      // Competition type configuration
      const COMPETITION_CONFIG = {
        KO: {
          types: ['KO_REGULAR', 'KO_CLUBS', 'KO_BASE'],
          allowedSizes: [8, 16, 32, 64],
          defaultSize: null
        },
        LEAGUE: {
          types: ['ELITE_LEAGUE', 'PRO_LEAGUE', 'SUPER_LEAGUE', 'ROOKIE_LEAGUE', 'FRIENDLY_LEAGUE'],
          defaultSize: 20
        },
        GNG: {
          type: 'GNG',
          fixedSize: 25
        }
      };

      // Handle competition type-specific logic
      if (COMPETITION_CONFIG.KO.types.includes(type)) {
        // Knockout tournament validation
        if (!COMPETITION_CONFIG.KO.allowedSizes.includes(competitionData.numberOfPlayers)) {
          return res.status(400).json({
            success: false,
            message: `KO tournaments require ${COMPETITION_CONFIG.KO.allowedSizes.join(', ')} players`
          });
        }
      } else if (COMPETITION_CONFIG.LEAGUE.types.includes(type)) {
        // League tournament defaults
        competitionData.numberOfPlayers = numberOfPlayers || COMPETITION_CONFIG.LEAGUE.defaultSize;
      } else if (type === COMPETITION_CONFIG.GNG.type) {
        // GNG validation
        competitionData.numberOfPlayers = COMPETITION_CONFIG.GNG.fixedSize;
        competitionData.knockoutQualifiedCount = knockoutQualifiedCount;

        if (numberOfPlayers && numberOfPlayers !== COMPETITION_CONFIG.GNG.fixedSize) {
          return res.status(400).json({
            success: false,
            message: `GNG competitions must have exactly ${COMPETITION_CONFIG.GNG.fixedSize} players`
          });
        }

        if (!knockoutQualifiedCount || knockoutQualifiedCount >= COMPETITION_CONFIG.GNG.fixedSize) {
          return res.status(400).json({
            success: false,
            message: 'Invalid knockout qualification count for GNG'
          });
        }
      }

      // Player validation
      if (players && Array.isArray(players)) {
        // Validate ObjectIDs
        const invalidIds = players.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid player IDs: ${invalidIds.join(', ')}`
          });
        }

        // Check player count match
        if (players.length !== competitionData.numberOfPlayers) {
          return res.status(400).json({
            success: false,
            message: `Expected ${competitionData.numberOfPlayers} players, received ${players.length}`
          });
        }

        // Verify player existence
        const existingPlayers = await Player.find({ _id: { $in: players } });
        if (existingPlayers.length !== players.length) {
          const missingCount = players.length - existingPlayers.length;
          return res.status(400).json({
            success: false,
            message: `${missingCount} player(s) not found in database`
          });
        }

        competitionData.players = players;
      }

      // Create and save competition
      const competition = new Competition(competitionData);
      await competition.save();

      // Return populated response
      const populatedCompetition = await Competition.findById(competition._id)
        .populate('players', 'name _id createdAt')
        .lean();

      return res.status(201).json({
        success: true,
        data: populatedCompetition
      });

    } catch (err) {
      console.error('[Competition Controller] Create error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to create competition'
      });
    }
  },

  getAllCompetitions: async (req, res) => {
    try {
      const competitions = await Competition.find()
        .populate('players', 'name _id')
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        count: competitions.length,
        data: competitions
      });

    } catch (err) {
      console.error('[Competition Controller] Fetch error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve competitions'
      });
    }
  },

  getCompetitionById: async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid competition ID format'
        });
      }

      const competition = await Competition.findById(req.params.id)
        .populate('players', 'name _id')
        .lean();

      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: competition
      });

    } catch (err) {
      console.error('[Competition Controller] Fetch single error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve competition'
      });
    }
  },

  updateCompetition: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid competition ID format'
        });
      }

      // Handle player updates
      if (updateData.players) {
        if (!Array.isArray(updateData.players)) {
          return res.status(400).json({
            success: false,
            message: 'Players must be an array of IDs'
          });
        }

        const invalidIds = updateData.players.filter(id => 
          !mongoose.Types.ObjectId.isValid(id)
        );

        if (invalidIds.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid player IDs: ${invalidIds.join(', ')}`
          });
        }

        const existingPlayers = await Player.countDocuments({ 
          _id: { $in: updateData.players } 
        });

        if (existingPlayers !== updateData.players.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more players not found'
          });
        }
      }

      const updatedCompetition = await Competition.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('players', 'name _id');

      if (!updatedCompetition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedCompetition
      });

    } catch (err) {
      console.error('[Competition Controller] Update error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to update competition'
      });
    }
  },

  deleteCompetition: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid competition ID format'
        });
      }

      const competition = await Competition.findByIdAndDelete(id);

      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }

      // Optional: Handle associated data cleanup
      await Player.updateMany(
        { _id: { $in: competition.players } },
        { $pull: { competitions: competition._id } }
      );

      return res.status(200).json({
        success: true,
        message: 'Competition deleted successfully'
      });

    } catch (err) {
      console.error('[Competition Controller] Delete error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete competition'
      });
    }
  }
};

module.exports = competitionController;