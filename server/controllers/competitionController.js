const Competition = require('../models/Competition');
const Player = require('../models/Player');
const mongoose = require('mongoose');
const Fixture = require('../models/Fixture');
const Standing = require('../models/Standing');
const Clan = require('../models/Clan');
const { generateClanWarRound } = require('../utils/fixtureGenerator');  
const competitionController = {
  createClanWarCompetition: async (req, res) => {
      try {
    const { name, numberOfClans, clans } = req.body;

    
    if (!name || !numberOfClans || !clans || !Array.isArray(clans)) {
      return res.status(400).json({ 
        message: 'Name, numberOfClans, and clans array are required' 
      });
    }

    if (clans.length !== numberOfClans) {
      return res.status(400).json({ 
        message: `Expected ${numberOfClans} clans, but received ${clans.length}` 
      });
    }

    
    if (numberOfClans > 0 && (numberOfClans & (numberOfClans - 1)) !== 0) {
      return res.status(400).json({ 
        message: 'Number of clans must be a power of 2 (2, 4, 8, 16, etc.)' 
      });
    }

    
    const competition = new Competition({
      name,
      type: 'CLAN_WAR',
      numberOfClans,
      numberOfPlayers: numberOfClans * 5,
      players: [],
      clans: []
    });

    await competition.save();

    const createdClans = [];
    const allPlayers = [];

    
    for (const clanData of clans) {
      if (!clanData.name || !clanData.members || clanData.members.length !== 5) {
        
        await Competition.findByIdAndDelete(competition._id);
        return res.status(400).json({ 
          message: `Each clan must have a name and exactly 5 members. Clan "${clanData.name || 'Unknown'}" has ${clanData.members?.length || 0} members` 
        });
      }

      
      const clanPlayers = [];
      for (const memberName of clanData.members) {
        const player = new Player({
          name: memberName.trim(),
          competitionId: competition._id
        });
        await player.save();
        clanPlayers.push(player._id);
        allPlayers.push(player._id);
      }

      
      const clan = new Clan({
        name: clanData.name.trim(),
        competitionId: competition._id,
        members: clanPlayers
      });
      await clan.save();
      createdClans.push(clan._id);
    }

    
    competition.players = allPlayers;
    competition.clans = createdClans;
    await competition.save();

    
    await generateClanWarRound(competition._id, createdClans, 'Round 1');

    res.status(201).json({
      message: 'Clan War competition created successfully',
      competition: await Competition.findById(competition._id)
        .populate({
          path: 'clans',
          populate: { path: 'members', select: 'name' }
        })
    });

  } catch (error) {
    console.error('Error creating clan war:', error);
    res.status(500).json({ 
      message: 'Failed to create clan war competition',
      error: error.message 
    });
  }
  },
  


createClanWarCompetitionWithExistingClans: async (req, res) => {
  try {
    const { name, numberOfClans, clanIds } = req.body;

    
    if (!name || !numberOfClans || !clanIds || !Array.isArray(clanIds)) {
      return res.status(400).json({ 
        message: 'Name, numberOfClans, and clanIds array are required' 
      });
    }

    if (clanIds.length !== numberOfClans) {
      return res.status(400).json({ 
        message: `Expected ${numberOfClans} clans, but received ${clanIds.length}` 
      });
    }

    
    if (numberOfClans > 0 && (numberOfClans & (numberOfClans - 1)) !== 0) {
      return res.status(400).json({ 
        message: 'Number of clans must be a power of 2 (2, 4, 8, 16, etc.)' 
      });
    }

    
    const clans = await Clan.find({ _id: { $in: clanIds } })
      .populate('members', 'name');
    
    if (clans.length !== numberOfClans) {
      return res.status(404).json({ 
        message: 'One or more selected clans not found' 
      });
    }

    
    for (const clan of clans) {
      if (clan.members.length !== 5) {
        return res.status(400).json({ 
          message: `Clan "${clan.name}" must have exactly 5 members. Currently has ${clan.members.length} members.` 
        });
      }
    }

    
    const clanNames = clans.map(c => c.name.toLowerCase().trim());
    if (new Set(clanNames).size !== clanNames.length) {
      return res.status(400).json({ 
        message: 'Selected clans must have unique names' 
      });
    }

    
    const clansInActiveCompetitions = await Clan.find({
      _id: { $in: clanIds },
      competitionId: { $exists: true }
    }).populate('competitionId', 'name status');

    const activeClans = clansInActiveCompetitions.filter(
      clan => clan.competitionId && 
      (clan.competitionId.status === 'upcoming' || clan.competitionId.status === 'ongoing')
    );

    if (activeClans.length > 0) {
      return res.status(400).json({
        message: `Some clans are already in active competitions: ${activeClans.map(c => `${c.name} (in ${c.competitionId.name})`).join(', ')}`
      });
    }

    
    const allPlayerIds = clans.flatMap(clan => clan.members.map(m => m._id));

    
    const uniquePlayerIds = new Set(allPlayerIds.map(id => id.toString()));
    if (uniquePlayerIds.size !== allPlayerIds.length) {
      return res.status(400).json({
        message: 'A player cannot be in multiple clans'
      });
    }

    
    const competition = new Competition({
      name,
      type: 'CLAN_WAR',
      numberOfClans,
      numberOfPlayers: allPlayerIds.length,
      players: allPlayerIds,
      clans: clanIds,
      status: 'ongoing'
    });

    await competition.save();

    
    await Clan.updateMany(
      { _id: { $in: clanIds } },
      { 
        $set: { 
          competitionId: competition._id,
          points: 0,
          matchesWon: 0,
          matchesDrawn: 0,
          matchesLost: 0,
          isEliminated: false
        } 
      }
    );

    
    await generateClanWarRound(competition._id, clanIds, 'Round 1');

    
    const populatedCompetition = await Competition.findById(competition._id)
      .populate('players', 'name')
      .populate({
        path: 'clans',
        populate: { path: 'members', select: 'name' }
      });

    res.status(201).json({
      message: 'Clan War competition created successfully with existing clans',
      competition: populatedCompetition
    });

  } catch (error) {
    console.error('Error creating clan war competition with existing clans:', error);
    res.status(500).json({ 
      message: 'Failed to create clan war competition',
      error: error.message 
    });
  }
},
  updateClanWarResult: async (req, res) => {
     try {
    const { fixtureId, matchIndex } = req.params;
    const { homeScore, awayScore } = req.body;

    const fixture = await Fixture.findById(fixtureId);
    if (!fixture || !fixture.isClanWar) {
      return res.status(404).json({ message: 'Clan war fixture not found' });
    }

    const matchIdx = parseInt(matchIndex);
    if (matchIdx < 0 || matchIdx >= fixture.individualMatches.length) {
      return res.status(400).json({ message: 'Invalid match index' });
    }
    
    
    const match = fixture.individualMatches[matchIdx];
    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.status = 'completed';

    
    if (homeScore > awayScore) {
      match.result = 'home';
    } else if (awayScore > homeScore) {
      match.result = 'away';
    } else {
      match.result = 'draw';
    }

    await fixture.save(); 

    res.json({
      message: 'Match result updated successfully',
      fixture
    });

  } catch (error) {
    console.error('Error updating clan war match:', error);
    res.status(500).json({ 
      message: 'Failed to update match result',
      error: error.message 
    });
  }
  },
  getClanWarFixtures: async (req, res) => {
    try {
    const { competitionId } = req.params;

    const fixtures = await Fixture.find({
      competitionId,
      isClanWar: true
    })
    .populate({
      path: 'homeClan',
      populate: { path: 'members', select: 'name' }
    })
    .populate({
      path: 'awayClan', 
      populate: { path: 'members', select: 'name' }
    })
    .populate('individualMatches.homePlayer', 'name')
    .populate('individualMatches.awayPlayer', 'name')
    .sort({ createdAt: 1 });

    res.json(fixtures);

  } catch (error) {
    console.error('Error fetching clan war fixtures:', error);
    res.status(500).json({ 
      message: 'Failed to fetch fixtures',
      error: error.message 
    });
  }
  },
  clanWarNextRound: async (req, res) => {
    try {
    const { competitionId } = req.params;

    const competition = await Competition.findById(competitionId);
    if (!competition || competition.type !== 'CLAN_WAR') {
      return res.status(404).json({ message: 'Clan war competition not found' });
    }

    
    const currentRound = competition.currentRound.index || 0;
    const currentRoundName = `Round ${currentRound + 1}`;
    
    const fixtures = await Fixture.find({
      competitionId,
      round: currentRoundName,
      isClanWar: true,
      status: 'completed'
    }).populate('homeClan awayClan');

    if (fixtures.length === 0) {
      return res.status(400).json({ message: 'No completed fixtures found for current round' });
    }

    
    const allFixtures = await Fixture.find({
      competitionId,
      round: currentRoundName,
      isClanWar: true
    });

    const completedCount = allFixtures.filter(f => f.status === 'completed').length;
    if (completedCount < allFixtures.length) {
      return res.status(400).json({ 
        message: `Not all matches completed. ${completedCount}/${allFixtures.length} matches finished` 
      });
    }

    
    const winningClans = [];
    for (const fixture of fixtures) {
      let winnerClan;
      if (fixture.result === 'home') {
        winnerClan = fixture.homeClan;
      } else if (fixture.result === 'away') {
        winnerClan = fixture.awayClan;
      } else {
        
        
        winnerClan = Math.random() > 0.5 ? fixture.homeClan : fixture.awayClan;
      }
      winningClans.push(winnerClan._id);
    }

    
    const allClanIds = await Clan.find({ competitionId }).select('_id');
    const eliminatedClans = allClanIds.filter(clan => 
      !winningClans.some(winner => winner.equals(clan._id))
    );

    await Clan.updateMany(
      { _id: { $in: eliminatedClans } },
      { isEliminated: true }
    );

    
    if (winningClans.length === 1) {
      competition.status = 'completed';
      competition.isCompleted = true;
      competition.winnerClan = winningClans[0];
      await competition.save();

      return res.json({
        message: 'Competition completed!',
        winner: await Clan.findById(winningClans[0]).populate('members')
      });
    }

    
    const nextRoundName = `Round ${currentRound + 2}`;
    await generateClanWarRound(competitionId, winningClans, nextRoundName);

    
    competition.currentRound.index = currentRound + 1;
    competition.currentRound.name = nextRoundName;
    await competition.save();

    res.json({
      message: `${nextRoundName} generated successfully`,
      advancingClans: winningClans.length
    });

  } catch (error) {
    console.error('Error progressing clan war:', error);
    res.status(500).json({ 
      message: 'Failed to progress to next round',
      error: error.message 
    });
  }
},
  createCompetition: async (req, res) => {
    try {
      const { name, type, numberOfPlayers, players, knockoutQualifiedCount,rounds } = req.body;

      
      if (!name || !type) {
        return res.status(400).json({
          success: false,
          message: 'Name and type are required fields'
        });
      }

      
      const competitionData = {
        name,
        type,
        numberOfPlayers: numberOfPlayers || 0,
        players: [],
        rounds
      };

      
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

      
      if (COMPETITION_CONFIG.KO.types.includes(type)) {
        
        
      } else if (COMPETITION_CONFIG.LEAGUE.types.includes(type)) {
        
        competitionData.numberOfPlayers = numberOfPlayers || COMPETITION_CONFIG.LEAGUE.defaultSize;
        competitionData.rounds=rounds || 3;
      } else if (type === COMPETITION_CONFIG.GNG.type) {
        
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

      
      if (players && Array.isArray(players)) {
        
        const invalidIds = players.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid player IDs: ${invalidIds.join(', ')}`
          });
        }

        
        if (players.length !== competitionData.numberOfPlayers) {
          return res.status(400).json({
            success: false,
            message: `Expected ${competitionData.numberOfPlayers} players, received ${players.length}`
          });
        }

        
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
      
      const competition = new Competition(competitionData);
      await competition.save();

      
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

updatePlayerNameInCompetition : async (req, res) => {
  const { competitionId } = req.params;
  const { playerId, newName } = req.body;

  try {
    
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ success: false, message: 'Competition not found' });
    }

    
    if (!competition.players.includes(playerId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Player not part of this competition' 
      });
    }

    
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

    
    competition.players = competition.players.map(playerId =>
      playerId.toString() === oldPlayerId ? newPlayerId : playerId
    );
    await competition.save();

    
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

    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid competition ID format' });
    }
        console.log('Deleting competition with ID:', id);

    
    const [fixturesResult, standingsResult] = await Promise.all([
      Fixture.deleteMany({ competitionId: id }),
      Standing.deleteMany({ competition: id })
    ]);

    
    const playersUpdate = await Player.updateMany(
      { competitions: id },
      { $pull: { competitions: id } }
    );
console.log('Fixtures deleted:', fixturesResult.deletedCount);
console.log('Standings deleted:', standingsResult.deletedCount);
    
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
},
 softDeleteCompetition : async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid competition ID format' });
    }

    console.log('Soft deleting competition with ID:', id);

    // Find competition (bypass soft delete filter)
    const competition = await Competition.findOne({ _id: id, isDeleted: false });

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    // Count related data before soft deleting
    const [fixturesCount, standingsCount, clansCount] = await Promise.all([
      Fixture.countDocuments({ competitionId: id, isDeleted: false }),
      Standing.countDocuments({ competition: id, isDeleted: false }),
      competition.type === 'CLAN_WAR' 
        ? Clan.countDocuments({ competitionId: id, isDeleted: false })
        : Promise.resolve(0)
    ]);

    // Store snapshot
    competition.deletionSnapshot = {
      fixturesCount,
      standingsCount,
      clansCount
    };

    // Soft delete competition
    await competition.softDelete(req.user?.id); // Pass user ID if available

    // Soft delete related fixtures
    await Fixture.updateMany(
      { competitionId: id, isDeleted: false },
      { 
        $set: { 
          isDeleted: true, 
          deletedAt: new Date() 
        } 
      }
    );

    // Soft delete related standings
    await Standing.updateMany(
      { competition: id, isDeleted: false },
      { 
        $set: { 
          isDeleted: true, 
          deletedAt: new Date() 
        } 
      }
    );

    // For CLAN_WAR, soft delete related clans
    if (competition.type === 'CLAN_WAR') {
      await Clan.updateMany(
        { competitionId: id, isDeleted: false },
        { 
          $set: { 
            isDeleted: true, 
            deletedAt: new Date() 
          } 
        }
      );
    }

    // Remove competition from players
    await Player.updateMany(
      { competitions: id },
      { $pull: { competitions: id } }
    );

    return res.status(200).json({
      success: true,
      message: 'Competition moved to trash. You can recover it from the Recover Competitions page.',
      deletedData: {
        competitionId: id,
        competitionName: competition.name,
        fixturesCount,
        standingsCount,
        clansCount,
        deletedAt: competition.deletedAt
      }
    });

  } catch (error) {
    console.error('Error soft deleting competition:', error);
    return res.status(500).json({ 
      error: 'Server error while deleting competition',
      details: error.message 
    });
  }
},

// Get all deleted competitions
 getDeletedCompetitions : async (req, res) => {
  try {
    const deletedCompetitions = await Competition.findDeleted()
      .populate('players', 'name _id')
      .populate('clans', 'name')
      .lean();
      console.log('sjfhs-',deletedCompetitions)

    // Add metadata about recoverable data
    const competitionsWithMetadata = deletedCompetitions.map(comp => ({
      ...comp,
      canRecover: true,
      recoverableData: {
        fixtures: comp.deletionSnapshot?.fixturesCount || 0,
        standings: comp.deletionSnapshot?.standingsCount || 0,
        clans: comp.deletionSnapshot?.clansCount || 0
      }
    }));

    return res.status(200).json({
      success: true,
      count: competitionsWithMetadata.length,
      data: competitionsWithMetadata
    });

  } catch (error) {
    console.error('Error fetching deleted competitions:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch deleted competitions',
      details: error.message 
    });
  }
},

// Recover a single competition
 recoverCompetition : async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid competition ID format' });
    }

    console.log('Recovering competition with ID:', id);

    // Find deleted competition
    const competition = await Competition.findOne({ _id: id, isDeleted: true });

    if (!competition) {
      return res.status(404).json({ error: 'Deleted competition not found' });
    }

    // Restore competition
    await competition.restore();

    // Restore related fixtures
    const fixturesResult = await Fixture.updateMany(
      { competitionId: id, isDeleted: true },
      { 
        $set: { 
          isDeleted: false, 
          deletedAt: null 
        } 
      }
    );

    // Restore related standings
    const standingsResult = await Standing.updateMany(
      { competition: id, isDeleted: true },
      { 
        $set: { 
          isDeleted: false, 
          deletedAt: null 
        } 
      }
    );

    // For CLAN_WAR, restore related clans
    let clansResult = { modifiedCount: 0 };
    if (competition.type === 'CLAN_WAR') {
      clansResult = await Clan.updateMany(
        { competitionId: id, isDeleted: true },
        { 
          $set: { 
            isDeleted: false, 
            deletedAt: null 
          } 
        }
      );
    }

    // Re-add competition to players
    await Player.updateMany(
      { _id: { $in: competition.players } },
      { $addToSet: { competitions: id } }
    );

    return res.status(200).json({
      success: true,
      message: 'Competition recovered successfully',
      recoveredData: {
        competitionId: id,
        competitionName: competition.name,
        fixturesRecovered: fixturesResult.modifiedCount,
        standingsRecovered: standingsResult.modifiedCount,
        clansRecovered: clansResult.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error recovering competition:', error);
    return res.status(500).json({ 
      error: 'Server error while recovering competition',
      details: error.message 
    });
  }
},

// Bulk recover competitions
 bulkRecoverCompetitions : async (req, res) => {
  try {
    const { competitionIds } = req.body;

    if (!Array.isArray(competitionIds) || competitionIds.length === 0) {
      return res.status(400).json({ error: 'competitionIds array is required' });
    }

    // Validate all IDs
    const invalidIds = competitionIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid competition IDs',
        invalidIds 
      });
    }

    console.log('Bulk recovering competitions:', competitionIds);

    const results = {
      successful: [],
      failed: []
    };

    // Process each competition
    for (const id of competitionIds) {
      try {
        const competition = await Competition.findOne({ _id: id, isDeleted: true });

        if (!competition) {
          results.failed.push({
            id,
            reason: 'Competition not found in trash'
          });
          continue;
        }

        // Restore competition and related data
        await competition.restore();

        await Promise.all([
          Fixture.updateMany(
            { competitionId: id, isDeleted: true },
            { $set: { isDeleted: false, deletedAt: null } }
          ),
          Standing.updateMany(
            { competition: id, isDeleted: true },
            { $set: { isDeleted: false, deletedAt: null } }
          ),
          competition.type === 'CLAN_WAR'
            ? Clan.updateMany(
                { competitionId: id, isDeleted: true },
                { $set: { isDeleted: false, deletedAt: null } }
              )
            : Promise.resolve(),
          Player.updateMany(
            { _id: { $in: competition.players } },
            { $addToSet: { competitions: id } }
          )
        ]);

        results.successful.push({
          id,
          name: competition.name
        });

      } catch (error) {
        console.error(`Error recovering competition ${id}:`, error);
        results.failed.push({
          id,
          reason: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Recovered ${results.successful.length} of ${competitionIds.length} competitions`,
      results
    });

  } catch (error) {
    console.error('Error in bulk recovery:', error);
    return res.status(500).json({ 
      error: 'Server error during bulk recovery',
      details: error.message 
    });
  }
},

// Permanently delete a competition (optional - use with caution)
 permanentlyDeleteCompetition : async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid competition ID format' });
    }

    console.log('Permanently deleting competition with ID:', id);

    // Find deleted competition
    const competition = await Competition.findOne({ _id: id, isDeleted: true });

    if (!competition) {
      return res.status(404).json({ error: 'Deleted competition not found' });
    }

    // Permanently delete all related data
    const [fixturesResult, standingsResult, clansResult] = await Promise.all([
      Fixture.deleteMany({ competitionId: id }),
      Standing.deleteMany({ competition: id }),
      competition.type === 'CLAN_WAR' 
        ? Clan.deleteMany({ competitionId: id })
        : Promise.resolve({ deletedCount: 0 })
    ]);

    // Remove from players
    await Player.updateMany(
      { competitions: id },
      { $pull: { competitions: id } }
    );

    // Delete competition
    await Competition.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: 'Competition permanently deleted',
      deletedCounts: {
        fixtures: fixturesResult.deletedCount,
        standings: standingsResult.deletedCount,
        clans: clansResult.deletedCount
      }
    });

  } catch (error) {
    console.error('Error permanently deleting competition:', error);
    return res.status(500).json({ 
      error: 'Server error while permanently deleting competition',
      details: error.message 
    });
  }
}
};

module.exports = competitionController;
