//fixturecontroller.ja
const Fixture = require('../models/Fixture');
const Competition = require('../models/Competition');
const Player = require('../models/Player');
const mongoose = require('mongoose');
const Standings = require('../models/Standing');
const {
  generateLeagueFixtures,
  generateKnockoutFixtures,
  ROUND_NAMES,
  generateFirstRoundFixtures,
  generateNextRoundFixtures,
  calculateTotalRounds,
  pairPlayers,
  shuffleArray,
  generateRoundRobinFixtures,



} = require('../utils/fixtureGenerator');
const { calculateStandings } = require('../utils/standingsCalculator');
let ioInstance;

// Helper function to calculate match dates
const calculateMatchDate = (fixtureIndex) => {
  const startDate = new Date();
  const weeksToAdd = Math.floor(fixtureIndex / 10); // 10 matches per week
  startDate.setDate(startDate.getDate() + (weeksToAdd * 7));
  return startDate;
};

exports.setIOInstance = (io) => {
  ioInstance = io;
};

exports.createFixturesForLeague = async (req, res) => {
  const { competitionId, rounds } = req.params;

  try {
    const competition = await Competition.findById(competitionId)
      .populate('players', 'name _id');

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    // Validate competition type
    const allowedTypes = ['ELITE_LEAGUE', 'PRO_LEAGUE', 'SUPER_LEAGUE',
      'ROOKIE_LEAGUE', 'FRIENDLY_LEAGUE', 'LEAGUE'];
    if (!allowedTypes.includes(competition.type)) {
      return res.status(400).json({
        error: 'Invalid competition type for league fixtures',
        allowedTypes
      });
    }

    // Process players
    const validPlayers = competition.players
      .filter(p => p?._id)
      .map(p => ({
        id: p._id.toString(),
        name: p.name || `Player ${p._id.toString().slice(-4)}`
      }));

    if (validPlayers.length < 2 || validPlayers.length > 100) {
      return res.status(400).json({
        error: validPlayers.length < 2 ? 'Not enough valid players' : 'Maximum 20 players allowed',
        playerCount: validPlayers.length
      });
    }

    // Generate fixtures
    const playerMap = new Map(validPlayers.map(p => [p.id, p.name]));
    const rawFixtures = generateLeagueFixtures(
      validPlayers.map(p => p.id),
      playerMap,
      rounds ? parseInt(rounds) : competition.rounds || 3
    );

    // Add competition metadata
    const fixturesData = rawFixtures.map((f, index) => ({
      ...f,
      competitionId,
      matchDate: calculateMatchDate(index),
      status: 'pending',
      createdAt: new Date()
    }));

    // Remove transaction logic and use bulk operations
    await Fixture.deleteMany({ competitionId });
    const insertedFixtures = await Fixture.insertMany(fixturesData);

    const roundNumbers = [...new Set(insertedFixtures.map(f =>
      parseInt(f.round.match(/Matchday (\d+)/)?.[1] || '1')))
    ];

    await Competition.findByIdAndUpdate(
      competitionId,
      {
        status: 'ongoing',
        fixtureGeneratedAt: new Date(),
        currentRound: { index: 0, name: 'Matchday 1' },
        totalRounds: Math.max(...roundNumbers) || 1
      }
    );

    res.status(201).json({
      success: true,
      message: `${insertedFixtures.length} league fixtures generated`,
      fixtureCount: insertedFixtures.length
    });

  } catch (err) {
    console.error('League Fixture Error:', err);
    const errorMessage = process.env.NODE_ENV === 'development'
      ? err.message
      : 'Fixture generation failed';
    res.status(500).json({ success: false, error: errorMessage });
  }
};
exports.getclanWarFixtures = async (req, res) => {
  try {
    const { competitionId } = req.params;

    const fixtures = await Fixture.find({
      competitionId,
      isClanWar: true
    })
      .populate({
        path: 'homeClan',
        select: 'name members points matchesWon matchesDrawn matchesLost',
        populate: {
          path: 'members',
          select: 'name'
        }
      })
      .populate({
        path: 'awayClan',
        select: 'name members points matchesWon matchesDrawn matchesLost',
        populate: {
          path: 'members',
          select: 'name'
        }
      })
      .populate('individualMatches.homePlayer', 'name')
      .populate('individualMatches.awayPlayer', 'name')
      .sort({ round: 1, createdAt: 1 });

    // Transform the data to include player names in individual matches
    const transformedFixtures = fixtures.map(fixture => {
      const fixtureObj = fixture.toObject();

      if (fixtureObj.individualMatches && fixtureObj.individualMatches.length > 0) {
        fixtureObj.individualMatches = fixtureObj.individualMatches.map(match => ({
          ...match,
          homePlayerName: match.homePlayer?.name || match.homePlayerName || 'TBD',
          awayPlayerName: match.awayPlayer?.name || match.awayPlayerName || 'TBD'
        }));
      }

      return fixtureObj;
    });

    res.status(200).json({
      success: true,
      data: transformedFixtures,
      count: transformedFixtures.length
    });

  } catch (error) {
    console.error('Error fetching clan war fixtures:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clan war fixtures',
      error: error.message
    });
  }
};
// Knockout Fixture Management
exports.generateKnockoutFixturesHandler = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.competitionId);
    if (!competition) return res.status(404).json({ error: 'Competition not found' });

    // Delete existing fixtures
    await Fixture.deleteMany({ competitionId: competition._id });

    // Generate and save initial fixtures
    const fixtures = generateKnockoutFixtures.initialize(competition);
    await Fixture.insertMany(fixtures);

    // Update competition state
    const initialRound = ROUND_NAMES[competition.players.length][0];
    await Competition.findByIdAndUpdate(competition._id, {
      currentRound: { index: 0, name: initialRound },
      isCompleted: false,
      winner: null
    });

    res.status(201).json({ success: true, data: fixtures });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to initialize knockout fixtures'
    });
  }
};

exports.generateNextRoundHandler = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.competitionId);
    if (!competition) return res.status(404).json({ error: 'Competition not found' });

    // Verify current round completion
    const pendingFixtures = await Fixture.countDocuments({
      competitionId: competition._id,
      round: competition.currentRound.name,
      status: 'pending'
    });

    if (pendingFixtures > 0) {
      return res.status(400).json({
        success: false,
        error: `${pendingFixtures} pending matches in current round`
      });
    }

    // Collect winners
    const currentFixtures = await Fixture.find({
      competitionId: competition._id,
      round: competition.currentRound.name
    });

    const winners = currentFixtures.map(f => {
      if (!f.result) throw new Error(`Missing result for fixture ${f._id}`);
      return f.result === 'home' ? f.homePlayer : f.awayPlayer;
    });

    // Handle final round
    const currentRoundIndex = competition.currentRound.index;
    const totalRounds = ROUND_NAMES[competition.players.length].length;

    if (currentRoundIndex >= totalRounds - 1) {
      await Competition.findByIdAndUpdate(competition._id, {
        isCompleted: true,
        winner: winners[0]
      });
      return res.json({
        success: true,
        message: 'Competition completed',
        winner: winners[0]
      });
    }

    // Generate next round
    const nextFixtures = generateKnockoutFixtures.nextRound(competition, winners);
    await Fixture.insertMany(nextFixtures);

    // Update competition state
    const nextRoundIndex = currentRoundIndex + 1;
    const nextRoundName = ROUND_NAMES[competition.players.length][nextRoundIndex];

    await Competition.findByIdAndUpdate(competition._id, {
      currentRound: { index: nextRoundIndex, name: nextRoundName }
    });

    res.status(201).json({
      success: true,
      message: `Generated ${nextFixtures.length} fixtures for ${nextRoundName}`,
      data: nextFixtures
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to generate next round'
    });
  }
};
exports.createFixturesForGroupStage = async (req, res) => {
  try {
    const { competitionId } = req.params;

    // Find the competition and populate players
    const competition = await Competition.findById(competitionId).populate('players');

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    // Check if competition type is GROUP_STAGE
    if (competition.type !== 'GROUP_STAGE') {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is only for GROUP_STAGE competitions'
      });
    }

    // Check if fixtures already exist
    const existingFixtures = await Fixture.find({ competitionId });
    if (existingFixtures.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Fixtures already exist for this competition'
      });
    }

    const numberOfPlayers = competition.numberOfPlayers;
    const players = competition.players;

    // Validate player count matches registered players
    if (players.length !== numberOfPlayers) {
      return res.status(400).json({
        success: false,
        message: `Expected ${numberOfPlayers} players, but found ${players.length}`
      });
    }

    // Determine group configuration
    let groupCount, playersPerGroup;

    if (numberOfPlayers === 32) {
      groupCount = 8;
      playersPerGroup = 4;
    } else if (numberOfPlayers === 64) {
      groupCount = 8;
      playersPerGroup = 8;
    } else {
      return res.status(400).json({
        success: false,
        message: 'GROUP_STAGE only supports 32 or 64 players'
      });
    }

    // Shuffle players for random group assignment
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

    // Create groups
    const groups = [];
    for (let i = 0; i < groupCount; i++) {
      const groupPlayers = shuffledPlayers.slice(
        i * playersPerGroup,
        (i + 1) * playersPerGroup
      );
      groups.push({
        name: `Group ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
        players: groupPlayers
      });
    }

    // Generate fixtures for each group
    const allFixtures = [];

    for (const group of groups) {
      const groupFixtures = await generateRoundRobinFixtures(
        group.players,
        competitionId,
        group.name
      );
      allFixtures.push(...groupFixtures);
    }

    // Save all fixtures to database
    const savedFixtures = await Fixture.insertMany(allFixtures);

    // Update competition status
    await Competition.findByIdAndUpdate(competitionId, {
      status: 'ongoing',
      totalRounds: Math.ceil(Math.log2(playersPerGroup)) // Approximate rounds needed
    });

    return res.status(201).json({
      success: true,
      message: 'Group stage fixtures created successfully',
      data: {
        totalFixtures: savedFixtures.length,
        groupCount,
        playersPerGroup,
        groups: groups.map(group => ({
          name: group.name,
          players: group.players.map(p => ({
            id: p._id,
            name: p.name
          }))
        }))
      }
    });

  } catch (error) {
    console.error('Error creating group stage fixtures:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }


}
exports.getKnockoutCompetitions = async (req, res) => {
  try {
    const competitions = await Competition.find({
      type: { $in: ['KO_REGULAR', 'KO_CLUBS', 'KO_BASE', 'LEAGUE'] }
    }).sort({ createdAt: -1 });

    res.status(200).json(competitions);
  } catch (error) {
    console.error('Error fetching knockout competitions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCompetitionById = async (req, res) => {
  try {
    const { competitionId } = req.params;

    const competition = await Competition.findById(competitionId)
      .select('-__v') // exclude unwanted fields if needed
      .populate([
        { path: 'players', select: 'name teamName credits' },
        { path: 'winner', select: 'name teamName' }
      ])
      .lean(); // improves performance by skipping Mongoose document methods

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    res.status(200).json(competition);
  } catch (error) {
    console.error('Error fetching competition:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFixturesByCompetition = async (req, res) => {
  try {
    const fixtures = await Fixture.find({ competitionId: req.params.competitionId })
      .populate('competitionId', 'name') // Competition name
      .populate('homePlayer', 'name')    // Populate home player name
      .populate('awayPlayer', 'name')    // Populate away player name
      .select('-__v')                    // Exclude __v field
      .sort({ round: 1, bracketPosition: 1 }) // Properly sort for bracket visualization
      .lean(); // Lean for performance

    // Optionally map previousMatches to readable format (e.g. string ids)
    const formattedFixtures = fixtures.map(fixture => ({
      ...fixture,
      previousMatches: fixture.previousMatches?.map(match => match.toString())
    }));

    res.status(200).json(formattedFixtures);
  } catch (error) {
    console.error('Fixture Fetch Error:', error);
    res.status(500).json({
      message: 'Fetch failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



// Enhanced knockout fixture generation
exports.generateKoFixtures = async (req, res) => {
  try {
    const { competitionId } = req.params;

    const competition = await Competition.findById(competitionId)
      .populate('players', 'name _id'); // Ensure _id and name are populated

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    if (!['KO_REGULAR', 'KO_CLUBS', 'KO_BASE'].includes(competition.type)) {
      return res.status(400).json({ message: 'Invalid competition type' });
    }

    const numPlayers = competition.players.length;

    if (![8, 16, 32, 64].includes(numPlayers)) {
      return res.status(400).json({ message: 'Invalid player count (must be 8, 16, 32, or 64)' });
    }

    // Validate and prepare player data
    const validPlayers = competition.players
      .filter(p => p?._id)
      .map(p => ({
        id: p._id.toString(),
        name: p.name || `Player ${p._id.toString().slice(-4)}`
      }));

    // Create a map of player IDs to names
    const playerMap = new Map(validPlayers.map(p => [p.id, p.name]));

    // Generate first-round fixtures
    const fixtures = generateFirstRoundFixtures(
      validPlayers.map(p => p.id),
      competitionId,
      numPlayers,
      playerMap
    ).map(f => ({
      ...f,
      status: 'pending',
      createdAt: new Date()
    }));

    console.log("Generated fixture objects:", fixtures);

    // Remove existing fixtures for the competition
    await Fixture.deleteMany({ competitionId });

    // Insert the new fixtures
    const createdFixtures = await Fixture.insertMany(fixtures);

    // Update competition status and rounds info
    await Competition.findByIdAndUpdate(
      competitionId,
      {
        status: 'ongoing',
        currentRound: {
          index: 0,
          name: createdFixtures[0]?.round || 'Round 1'
        },
        totalRounds: calculateTotalRounds(numPlayers)
      }
    );

    return res.status(201).json({
      success: true,
      message: `${fixtures.length} fixtures generated successfully.`,
      fixtures: createdFixtures
    });

  } catch (error) {
    console.error('Fixture Generation Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Fixture generation failed.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update fixture result

// Enhanced fixture result update with name validation
exports.updateKoFixtureResult = async (req, res) => {
  try {
    const { fixtureId } = req.params;
    const { homeScore, awayScore } = req.body;

    if (typeof homeScore !== 'number' || typeof awayScore !== 'number' ||
      homeScore < 0 || awayScore < 0) {
      return res.status(400).json({ message: 'Invalid scores' });
    }

    const fixture = await Fixture.findById(fixtureId);
    if (!fixture) return res.status(404).json({ message: 'Fixture not found' });
    if (fixture.status === 'completed') {
      return res.status(400).json({ message: 'Fixture already completed' });
    }

    let result;
    if (homeScore > awayScore) {
      result = 'home';
    } else if (awayScore > homeScore) {
      result = 'away';
    } else {
      return res.status(400).json({ message: 'Knockout matches require a winner' });
    }

    const updatedFixture = await Fixture.findByIdAndUpdate(
      fixtureId,
      {
        homeScore,
        awayScore,
        result,
        status: 'completed',
        completedAt: new Date()
      },
      { new: true }
    );

    res.status(200).json({
      message: 'Result updated',
      fixture: updatedFixture
    });
  } catch (error) {
    console.error('Result Update Error:', error);
    res.status(500).json({
      message: 'Update failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
async function updateCompetitionPlayerNames(competitionId, playerId, storedName) {
  const currentPlayer = await Player.findById(playerId);
  if (currentPlayer.name !== storedName) {
    await Fixture.updateMany(
      { competitionId, $or: [{ homePlayer: playerId }, { awayPlayer: playerId }] },
      {
        $set: {
          'homePlayerName': currentPlayer.name,
          'awayPlayerName': currentPlayer.name
        }
      }
    );
    await Standings.updateMany(
      { competition: competitionId, player: playerId },
      { $set: { playerName: currentPlayer.name } }
    );
  }
}
exports.advanceToNextRound = async (req, res) => {
  try {
    const { competitionId, currentRound } = req.body;

    // Validate input
    if (!competitionId || !currentRound) {
      return res.status(400).json({ message: 'Competition ID and current round are required' });
    }

    // Get competition details
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // Check current round fixtures
    const currentRoundFixtures = await Fixture.find({
      competitionId,
      round: currentRound
    });

    if (currentRoundFixtures.length === 0) {
      return res.status(404).json({ message: 'No fixtures found for the current round' });
    }

    // Verify all fixtures are completed
    const incompleteFixtures = currentRoundFixtures.filter(f => f.status !== 'completed');
    if (incompleteFixtures.length > 0) {
      return res.status(400).json({
        message: 'Complete all current round matches before advancing'
      });
    }

    // Handle final round
    if (currentRound === 'Final') {
      const finalFixture = currentRoundFixtures[0];
      const winnerId = finalFixture.result === 'home'
        ? finalFixture.homePlayer
        : finalFixture.awayPlayer;

      await Competition.findByIdAndUpdate(competitionId, {
        status: 'completed',
        isCompleted: true,
        winner: winnerId
      });

      return res.status(200).json({
        message: 'Tournament completed successfully',
        winnerId
      });
    }
    const playerNames = new Map();
    currentRoundFixtures.forEach(fixture => {
      playerNames.set(fixture.homePlayer, fixture.homePlayerName);
      playerNames.set(fixture.awayPlayer, fixture.awayPlayerName);
    });

    // Generate next round fixtures
    const nextRoundFixtures = generateNextRoundFixtures(
      currentRoundFixtures,
      competitionId,
      currentRound,
      competition.numberOfPlayers,
      playerNames


    );
    const nextRoundName = nextRoundFixtures[0].round;
    await Fixture.deleteMany({
      competitionId,
      round: nextRoundName
    });
    // Save new fixtures and update competition
    const createdFixtures = await Fixture.insertMany(nextRoundFixtures);

    await Competition.findByIdAndUpdate(competitionId, {
      currentRound: {
        index: competition.currentRound.index + 1,
        name: nextRoundName
      }
    });

    res.status(201).json({
      message: `Advanced to ${nextRoundName} successfully`,
      fixtures: createdFixtures
    });

  } catch (error) {
    console.error('Advancement error:', error);
    res.status(500).json({
      message: 'Server error during round advancement',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
};
// Update competition status
exports.updateCompetitionStatus = async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { status } = req.body;

    if (!['upcoming', 'ongoing', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const competition = await Competition.findByIdAndUpdate(
      competitionId,
      { status },
      { new: true }
    );

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    res.status(200).json({
      message: 'Competition status updated successfully',
      competition
    });
  } catch (error) {
    console.error('Error updating competition status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Set competition winner
exports.setCompetitionWinner = async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { winnerId } = req.body;

    if (!winnerId) {
      return res.status(400).json({ message: 'Winner ID is required' });
    }

    // Check if the player exists in the competition
    const competition = await Competition.findOne({
      _id: competitionId,
      players: winnerId
    });

    if (!competition) {
      return res.status(404).json({
        message: 'Competition not found or the specified player is not part of this competition'
      });
    }

    // Update competition with winner and status
    const updatedCompetition = await Competition.findByIdAndUpdate(
      competitionId,
      {
        winner: winnerId,
        status: 'completed',
        isCompleted: true
      },
      { new: true }
    );

    res.status(200).json({
      message: 'Competition winner set successfully',
      competition: updatedCompetition
    });
  } catch (error) {
    console.error('Error setting competition winner:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
exports.getCompetitionFixtures = async (req, res) => {
  try {
    const competitionId = req.params.competitionId;

    // 1. Fetch fixtures
    const fixtures = await Fixture.find({ competitionId })
      .populate('homePlayer awayPlayer', 'name')
      .lean();

    // ✅ CONDITION 1: Check if assignment is needed
    const needsAssignment = fixtures.some(f => f.matchday == null);

    if (needsAssignment) {
      // 2. Group by round
      const roundMap = new Map();

      fixtures.forEach(f => {
        const r = f.round ?? 1;
        if (!roundMap.has(r)) roundMap.set(r, []);
        roundMap.get(r).push(f);
      });

      const bulkOps = [];
      let matchdayOffset = 0;

      // 3. Assign matchdays using round-robin
      for (const [, roundFixtures] of [...roundMap.entries()].sort()) {
        // Only fixtures without matchday
        const unassigned = roundFixtures.filter(f => f.matchday == null);
        if (unassigned.length === 0) {
          // Still need to advance offset correctly
          const players = new Set();
          roundFixtures.forEach(f => {
            players.add(f.homePlayer._id.toString());
            players.add(f.awayPlayer._id.toString());
          });
          const count = players.size % 2 === 0 ? players.size - 1 : players.size;
          matchdayOffset += count;
          continue;
        }

        // Collect players
        const players = new Set();
        unassigned.forEach(f => {
          players.add(f.homePlayer._id.toString());
          players.add(f.awayPlayer._id.toString());
        });

        let playerList = [...players];
        if (playerList.length % 2 === 1) playerList.push(null);

        const totalMDs = playerList.length - 1;
        const half = playerList.length / 2;

        const fixed = playerList[0];
        let rotating = playerList.slice(1);

        for (let md = 0; md < totalMDs; md++) {
          const pairs = [
            [fixed, rotating[0]],
            ...Array.from({ length: half - 1 }, (_, i) => [
              rotating[i + 1],
              rotating[rotating.length - 1 - i]
            ])
          ];

          for (const [a, b] of pairs) {
            if (!a || !b) continue;

            const fixture = unassigned.find(f =>
              (f.homePlayer._id.equals(a) && f.awayPlayer._id.equals(b)) ||
              (f.homePlayer._id.equals(b) && f.awayPlayer._id.equals(a))
            );

            if (fixture) {
              bulkOps.push({
                updateOne: {
                  // ✅ CONDITION 2: only if matchday is still null
                  filter: { _id: fixture._id, matchday: { $in: [null, undefined] } },
                  update: { $set: { matchday: matchdayOffset + md + 1 } }
                }
              });
            }
          }

          rotating.unshift(rotating.pop());
        }

        matchdayOffset += totalMDs;
      }

      // 4. Persist matchdays ONCE
      if (bulkOps.length) {
        await Fixture.bulkWrite(bulkOps);
      }
    }

    // 5. Fetch final schedule
    const finalFixtures = await Fixture.find({ competitionId })
      .populate('homePlayer awayPlayer', 'name')
      .sort({ matchday: 1 });

    // 6. Group for frontend
    const scheduleMap = {};
    finalFixtures.forEach(f => {
      if (!scheduleMap[f.matchday]) scheduleMap[f.matchday] = [];
      scheduleMap[f.matchday].push(f);
    });

    const matchdaySchedule = Object.keys(scheduleMap)
      .sort((a, b) => a - b)
      .map(md => ({
        matchdayNumber: Number(md),
        fixtures: scheduleMap[md]
      }));

    res.json({ success: true, matchdaySchedule });

  } catch (err) {
    console.error('getCompetitionFixtures error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fixtures'
    });
  }
};
exports.updateFixtureResult = async (req, res) => {
  try {
    const { fixtureId } = req.params;
    // We get status from body because frontend sends { status: 'pending' } on revert
    const { homeScore, awayScore, status } = req.body; 

    // 1. Find the fixture
    const fixture = await Fixture.findById(fixtureId);

    if (!fixture) {
      return res.status(404).json({
        success: false,
        error: 'Fixture not found'
      });
    }

    // --- 🔴 REVERT LOGIC ---
    // We check if scores are null OR if the frontend explicitly asked to set status to 'pending'
    // This prevents the bug where null becomes 0.
    const isRevert = (homeScore === null && awayScore === null) || status === 'pending';

    if (isRevert) {
      console.log(`[Fixture] Reverting fixture ${fixtureId} to pending.`);

      fixture.homeScore = null;
      fixture.awayScore = null;
      fixture.status = 'pending';  // Force status back to pending
      fixture.result = null;       // Clear the winner/draw
      fixture.completedAt = null;  // Clear completion timestamp

    } 
    // --- 🟢 UPDATE LOGIC ---
    else {
      
      // Validate inputs
      if (homeScore === undefined || awayScore === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Both homeScore and awayScore are required'
        });
      }

      // Convert to numbers safely
      const h = Number(homeScore);
      const a = Number(awayScore);

      if (isNaN(h) || isNaN(a)) {
        return res.status(400).json({
          success: false,
          error: 'Scores must be valid numbers'
        });
      }

      if (h < 0 || a < 0) {
        return res.status(400).json({
          success: false,
          error: 'Scores cannot be negative'
        });
      }

      // Apply updates
      fixture.homeScore = h;
      fixture.awayScore = a;
      fixture.status = 'completed'; // Mark as completed
      
      // Determine result
      if (h > a) {
        fixture.result = 'home';
      } else if (a > h) {
        fixture.result = 'away';
      } else {
        fixture.result = 'draw';
      }
      
      fixture.completedAt = new Date();
    }

    // 2. Save the fixture
    fixture.updatedAt = new Date();
    await fixture.save();

    // 3. Populate fixture data for response
    // Using .lean() for performance
    let populatedFixture = await Fixture.findById(fixtureId)
      .populate('homePlayer awayPlayer', 'name _id')
      .lean();

    // --- SAFETY CHECK: Prevent crash if players are missing ---
    if (!populatedFixture.homePlayer) {
      populatedFixture.homePlayer = { _id: fixture.homePlayer, name: "Unknown Player" };
    }
    if (!populatedFixture.awayPlayer) {
      populatedFixture.awayPlayer = { _id: fixture.awayPlayer, name: "Unknown Player" };
    }

    // 4. Standings & Sockets Logic
    const competitionId = fixture.competitionId || fixture.competition;

    if (competitionId) {
      try {
        const competition = await Competition.findById(competitionId).select('type').lean();
        // Skip standings calc for knockout games usually
        const isKnockout = competition?.type === 'KO_REGULAR';

        if (!isKnockout) {
          // Recalculate standings. 
          // If reverted, this match is now 'pending' so it won't count toward points.
          // If updated, it counts with the new scores.
          await calculateStandings(competitionId);
        }

        // Emit real-time updates
        if (global.io || req.app.get('io')) {
          const io = global.io || req.app.get('io');

          // Emit STANDINGS update (only for leagues)
          if (!isKnockout) {
            const updatedStandings = await Standing.find({
              competition: competitionId
            }).lean();

            io.emit('standings_update', {
              competitionId: competitionId.toString(),
              competitionType: competition?.type || 'LEAGUE',
              standings: updatedStandings,
              timestamp: new Date()
            });
          }

          // Emit FIXTURE update (always)
          io.emit('fixture_update', {
            competitionId: competitionId.toString(),
            fixture: populatedFixture,
            timestamp: new Date()
          });
        }
      } catch (standingsError) {
        console.error('Standings/Socket error:', standingsError);
        // We continue because the main update succeeded
      }
    }

    // 5. Send Success Response
    res.json({
      success: true,
      data: populatedFixture,
      message: fixture.status === 'pending' ? 'Fixture reverted successfully' : 'Fixture updated successfully'
    });

  } catch (err) {
    console.error('Result Update Error:', err);

    let statusCode = 500;
    let errorMessage = 'Failed to update result';

    if (err.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = err.message;
    } else if (err.name === 'CastError') {
      statusCode = 400;
      errorMessage = 'Invalid fixture ID';
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
};
// Additional Methods
exports.getOngoingCompetitions = async (req, res) => {
  try {
    const competitions = await Competition.find({ status: 'ongoing' })
      .select('name type startDate currentRound');
    res.json({
      success: true, count: competitions.length,
      data: competitions
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ongoing competitions'
    });
  }
};

exports.getUpcomingCompetitions = async (req, res) => {
  try {
    const competitions = await Competition.find({ status: 'upcoming' })
      .select('name type startDate currentRound');
    res.json({ success: true, data: competitions });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ongoing competitions'
    });
  }
};
exports.getPlayerFixtures = async (req, res) => {
  try {
    const { competitionId, playerId } = req.params;
    // const Fixture = require('../models/Fixture');
    // const Competition = require('../models/Competition');
    // const Player = require('../models/Player');

    // Verify competition exists
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // Verify player exists
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Get all fixtures where this player is home or away
    const fixtures = await Fixture.find({
      competitionId,
      isDeleted: false,
      $or: [
        { homePlayer: playerId },
        { awayPlayer: playerId }
      ]
    })
      .populate('homePlayer', 'name')
      .populate('awayPlayer', 'name')
      .sort({ updatedAt: -1 }) // <-- THIS is what you want
      .lean();               // keep all fields including updatedAt


    // Format the response
    const formattedFixtures = fixtures.map(fixture => ({
      _id: fixture._id,
      round: fixture.round,
      matchDate: fixture.matchDate,
      status: fixture.status,
      result: fixture.result,
      homePlayer: {
        _id: fixture.homePlayer?._id,
        name: fixture.homePlayerName || fixture.homePlayer?.name
      },
      awayPlayer: {
        _id: fixture.awayPlayer?._id,
        name: fixture.awayPlayerName || fixture.awayPlayer?.name || 'BYE'
      },
      homeScore: fixture.homeScore,
      awayScore: fixture.awayScore,
      isHomePlayer: fixture.homePlayer?._id?.toString() === playerId,
      bracketPosition: fixture.bracketPosition
    }));

    res.json({
      competition: {
        _id: competition._id,
        name: competition.name,
        type: competition.type
      },
      player: {
        _id: player._id,
        name: player.name
      },
      fixtures: formattedFixtures
    });

  } catch (error) {
    console.error('Error fetching player fixtures:', error);
    res.status(500).json({ message: 'Failed to fetch player fixtures', error: error.message });
  }
};
