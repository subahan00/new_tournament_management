const Competition = require('../models/Competition');
const Player = require('../models/Player');
const mongoose = require('mongoose');
const Fixture = require('../models/Fixture');
const Standing = require('../models/Standing');

const competitionController = {
  createCompetition: async (req, res) => {
    try {
      const { name, type, numberOfPlayers, players, knockoutQualifiedCount,rounds } = req.body;

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
        players: [],
        rounds
      };

      // Competition type configuration
      const COMPETITION_CONFIG = {
        KO: {
          types: ['KO_REGULAR', 'KO_CLUBS', 'KO_BASE'],
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
        
      } else if (COMPETITION_CONFIG.LEAGUE.types.includes(type)) {
        // League tournament defaults
        competitionData.numberOfPlayers = numberOfPlayers || COMPETITION_CONFIG.LEAGUE.defaultSize;
        competitionData.rounds=rounds || 3;
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
      console.log('Competition data:', competitionData);
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
// controllers/competitionController.js
updatePlayerNameInCompetition : async (req, res) => {
  const { competitionId } = req.params;
  const { playerId, newName } = req.body;

  try {
    // Validate competition exists
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ success: false, message: 'Competition not found' });
    }

    // Validate player is part of the competition
    if (!competition.players.includes(playerId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Player not part of this competition' 
      });
    }

    // Update competition-specific fixtures
    const [homeUpdates, awayUpdates] = await Promise.all([
      Fixture.updateMany(
        { competitionId, homePlayer: playerId },
        { $set: { homePlayerName: newName } }
      ),
      Fixture.updateMany(
        { competitionId, awayPlayer: playerId },
        { $set: { awayPlayerName: newName } }
      )
    ]);

    // Update competition-specific standings
    const standingsUpdate = await Standing.updateMany(
      { competition: competitionId, player: playerId },
      { $set: { playerName: newName } }
    );

    res.json({
      success: true,
      message: `Updated ${homeUpdates.modifiedCount + awayUpdates.modifiedCount} fixtures`,
      standingsUpdated: standingsUpdate.modifiedCount
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
},
replacePlayerInCompetition: async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPlayerId, newPlayerId } = req.body;

    if (!oldPlayerId || !newPlayerId) {
      return res.status(400).json({ message: 'Both old and new player IDs are required' });
    }

    if (oldPlayerId === newPlayerId) {
      return res.status(400).json({ message: 'Old and new player cannot be the same' });
    }

    const competition = await Competition.findById(id);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    const oldPlayerExists = competition.players.some(
      playerId => playerId.toString() === oldPlayerId
    );
    if (!oldPlayerExists) {
      return res.status(400).json({ message: 'Old player not found in this competition' });
    }

    const newPlayer = await Player.findById(newPlayerId);
    if (!newPlayer) {
      return res.status(404).json({ message: 'New player not found' });
    }

    const newPlayerExists = competition.players.some(
      playerId => playerId.toString() === newPlayerId
    );
    if (newPlayerExists) {
      return res.status(400).json({ message: 'New player is already in this competition' });
    }

    const oldPlayer = await Player.findById(oldPlayerId);
    if (!oldPlayer) {
      return res.status(404).json({ message: 'Old player not found' });
    }

    // Replace old player with new player in competition
    competition.players = competition.players.map(playerId =>
      playerId.toString() === oldPlayerId ? newPlayerId : playerId
    );
    await competition.save();

    // Update fixtures
    await Promise.all([
      Fixture.updateMany(
        { competitionId: id, homePlayer: oldPlayerId },
        { homePlayer: newPlayerId, homePlayerName: newPlayer.name }
      ),
      Fixture.updateMany(
        { competitionId: id, awayPlayer: oldPlayerId },
        { awayPlayer: newPlayerId, awayPlayerName: newPlayer.name }
      )
    ]);
  await Standing.updateMany(
      { 
        competition: id, 
        player: oldPlayerId 
      },
      {
        player: newPlayerId,
        playerName: newPlayer.name
      }
    );
    // Optional: update standings if you have them
    // await Standing.updateMany(
    //   { competition: id, player: oldPlayerId },
    //   { player: newPlayerId, playerName: newPlayer.name }
    // );

    res.json({
      message: `Player ${oldPlayer.name} successfully replaced with ${newPlayer.name}`,
      oldPlayer: { id: oldPlayer._id, name: oldPlayer.name },
      newPlayer: { id: newPlayer._id, name: newPlayer.name }
    });

  } catch (error) {
    console.error('Error replacing player in competition:', error);
    res.status(500).json({
      message: 'Error replacing player in competition',
      error: error.message
    });
  }
}
,
 getAllPlayers :async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    // Validate competition ID format if needed
    if (!isValidId(competitionId)) {
      throw httpError(400, 'Invalid competition ID');
    }

    const players = await CompetitionService.getPlayersByCompetitionId(competitionId);
    
    if (!players || players.length === 0) {
      throw httpError(404, 'No players found in this competition');
    }

    res.json({
      success: true,
      count: players.length,
      data: players
    });
  } catch (error) {
    throw httpError(error.status || 500, error.message || 'Error retrieving players');
  }
},

  getAllCompetitions: async (req, res) => {
    try {
      const competitions = await Competition.find()
        .populate('players', 'name _id')
        .sort({ createdAt: -1 })
        .lean();

          return res.status(200).json(competitions);


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
      const { name, status } = req.body;

      const competition = await Competition.findByIdAndUpdate(
        id,
        { name, status },
        { new: true, runValidators: true }
      ).populate('players');

      if (!competition) throw new Error('Competition not found', 404);

      res.json({ success: true, data: competition });

    } catch (error) {
      handleCompetitionError(res, error);
    }
  },

   updateCompetitionPlayers: async (req, res) => {
    try {
      const { id } = req.params;
      const { addedPlayers = [], removedPlayers = [] } = req.body;

      await validatePlayerIds([...addedPlayers, ...removedPlayers]);

      const competition = await Competition.findByIdAndUpdate(
        id,
        {
          $addToSet: { players: { $each: addedPlayers } },
          $pull: { players: { $in: removedPlayers } }
        },
        { new: true, runValidators: true }
      ).populate('players');

      if (!competition) throw new Error('Competition not found', 404);

      // Archive affected fixtures instead of matches
      await Fixture.updateMany(
        { 
          competitionId: id,
          $or: [
            { homePlayer: { $in: removedPlayers } },
            { awayPlayer: { $in: removedPlayers } }
          ]
        },
        { status: 'archived' }
      );

      res.json({ success: true, data: competition });

    } catch (error) {
      handleCompetitionError(res, error);
    }
  },

getUpcomingLeagueCompetitions: async (req, res) => { 
  try {
    const competitions = await Competition.find({
      type: { $in: ['LEAGUE', 'KO_REGULAR'] },
      status: 'upcoming',
    });

    res.json({
      success: true,
      data: competitions
    });
  } catch (err) {
    console.error('Error fetching upcoming competitions:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server Error' 
    });
  }
},

deleteCompetition: async (req, res) => {
  try {
    const { id } = req.params;

    // Validate competition ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid competition ID format' });
    }
        console.log('Deleting competition with ID:', id);

    // 1. Delete related fixtures and standings
    const [fixturesResult, standingsResult] = await Promise.all([
      Fixture.deleteMany({ competitionId: id }),
      Standing.deleteMany({ competition: id })
    ]);

    // 2. Remove competition from players
    const playersUpdate = await Player.updateMany(
      { competitions: id },
      { $pull: { competitions: id } }
    );
console.log('Fixtures deleted:', fixturesResult.deletedCount);
console.log('Standings deleted:', standingsResult.deletedCount);
    // 3. Delete competition itself
    const competition = await Competition.findByIdAndDelete(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Competition deleted with related data',
      deletedCounts: {
        fixtures: fixturesResult.deletedCount,
        standings: standingsResult.deletedCount,
        playersUpdated: playersUpdate.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error deleting competition:', error);
    return res.status(500).json({ 
      error: 'Server error while deleting competition',
      details: error.message 
    });
  }
}

};

module.exports = competitionController;
