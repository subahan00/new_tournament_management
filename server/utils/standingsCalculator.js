//standingCalculator.js - OPTIMIZED VERSION

const Fixture = require('../models/Fixture');
const Competition = require('../models/Competition');
const Standing = require('../models/Standing');
const mongoose = require('mongoose');
const Player = require('../models/Player');

const calculateStandings = async (competitionId) => {
  try {
    // Single query to get competition with essential data
    const competition = await Competition.findById(competitionId)
      .select('players type')
      .lean();

    if (!competition) throw new Error('Competition not found');
    if (!competition.players?.length) throw new Error('No players in competition');

    // Route to appropriate function
    if (competition.type === 'GROUP_STAGE') {
      return await calculateGroupStageStandings(competitionId, competition);
    } else {
      return await calculateLeagueStandings(competitionId, competition);
    }

  } catch (error) {
    console.error('Standings calculation failed:', error);
    throw error;
  }
};

const calculateLeagueStandings = async (competitionId, competition) => {
  try {
    // PARALLEL QUERIES - Execute all at once
    const [fixtures, existingStandings, players] = await Promise.all([
      Fixture.find({ competitionId, status: 'completed' }).lean(),
      Standing.find({ competition: competitionId }).select('player playerName').lean(),
      Player.find({ _id: { $in: competition.players } }).select('name').lean()
    ]);

    // Create lookup maps for O(1) access
    const existingStandingsMap = new Map(
      existingStandings.map(s => [s.player.toString(), s])
    );
    const playersMap = new Map(
      players.map(p => [p._id.toString(), p])
    );

    // Initialize standings map
    const standingsMap = new Map();
    
    competition.players.forEach(playerId => {
      const playerIdStr = playerId.toString();
      const existing = existingStandingsMap.get(playerIdStr);
      const globalPlayer = playersMap.get(playerIdStr);

      standingsMap.set(playerIdStr, {
        competition: new mongoose.Types.ObjectId(competitionId),
        player: playerId,
        playerName: existing?.playerName || globalPlayer?.name || 'Unknown Player',
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      });
    });

    // Process fixtures (optimized loop)
    for (const fixture of fixtures) {
      const homeEntry = standingsMap.get(fixture.homePlayer.toString());
      const awayEntry = standingsMap.get(fixture.awayPlayer.toString());

      if (!homeEntry || !awayEntry) continue;

      // Update match counts
      homeEntry.matchesPlayed++;
      awayEntry.matchesPlayed++;

      // Update goals
      homeEntry.goalsFor += fixture.homeScore;
      homeEntry.goalsAgainst += fixture.awayScore;
      awayEntry.goalsFor += fixture.awayScore;
      awayEntry.goalsAgainst += fixture.homeScore;

      // Update points and results
      if (fixture.result === 'home') {
        homeEntry.wins++;
        homeEntry.points += 3;
        awayEntry.losses++;
      } else if (fixture.result === 'away') {
        awayEntry.wins++;
        awayEntry.points += 3;
        homeEntry.losses++;
      } else if (fixture.result === 'draw') {
        homeEntry.draws++;
        awayEntry.draws++;
        homeEntry.points++;
        awayEntry.points++;
      }
    }

    // Bulk database update
    const bulkOps = Array.from(standingsMap.values()).map(standing => ({
      updateOne: {
        filter: { 
          competition: standing.competition,
          player: standing.player 
        },
        update: { 
          $set: { 
            ...standing,
            lastUpdated: new Date()
          } 
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await Standing.bulkWrite(bulkOps, { ordered: false });
    }

    // Return pre-sorted standings
    return Array.from(standingsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const bGD = b.goalsFor - b.goalsAgainst;
      const aGD = a.goalsFor - a.goalsAgainst;
      return bGD !== aGD ? bGD - aGD : b.goalsFor - a.goalsFor;
    });

  } catch (error) {
    console.error('League standings calculation failed:', error);
    throw error;
  }
};

const calculateGroupStageStandings = async (competitionId, competition) => {
  try {
    console.time('GroupStageCalculation');
    
    // PARALLEL QUERIES - All at once instead of sequential
    const [fixtures, allFixtures, existingStandings, players] = await Promise.all([
      Fixture.find({ competitionId, status: 'completed' }).lean(),
      Fixture.find({ competitionId }).select('homePlayer awayPlayer round').lean(),
      Standing.find({ competition: competitionId }).select('player playerName group').lean(),
      Player.find({ _id: { $in: competition.players } }).select('name').lean()
    ]);

    console.timeLog('GroupStageCalculation', 'Database queries completed');

    if (fixtures.length === 0) {
      console.log('No completed fixtures found');
      return {};
    }

    // Create efficient lookup maps
    const existingStandingsMap = new Map();
    existingStandings.forEach(s => {
      existingStandingsMap.set(`${s.player.toString()}_${s.group}`, s);
    });

    const playersMap = new Map(
      players.map(p => [p._id.toString(), p])
    );

    // Build player-group mapping efficiently
    const playerGroupMap = new Map();
    allFixtures.forEach(fixture => {
      playerGroupMap.set(fixture.homePlayer.toString(), fixture.round);
      playerGroupMap.set(fixture.awayPlayer.toString(), fixture.round);
    });

    console.timeLog('GroupStageCalculation', 'Maps created');

    // Initialize all standings at once
    const standingsMap = new Map();
    competition.players.forEach(playerId => {
      const playerIdStr = playerId.toString();
      const group = playerGroupMap.get(playerIdStr);
      
      if (group) {
        const standingKey = `${playerIdStr}_${group}`;
        const existing = existingStandingsMap.get(standingKey);
        const globalPlayer = playersMap.get(playerIdStr);

        standingsMap.set(standingKey, {
          competition: new mongoose.Types.ObjectId(competitionId),
          player: playerId,
          playerName: existing?.playerName || globalPlayer?.name || 'Unknown Player',
          group: group,
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0
        });
      }
    });

    console.timeLog('GroupStageCalculation', 'Standings initialized');

    // Process fixtures efficiently
    for (const fixture of fixtures) {
      const homeKey = `${fixture.homePlayer.toString()}_${fixture.round}`;
      const awayKey = `${fixture.awayPlayer.toString()}_${fixture.round}`;
      
      const homeEntry = standingsMap.get(homeKey);
      const awayEntry = standingsMap.get(awayKey);

      if (!homeEntry || !awayEntry) continue;

      // Update match counts
      homeEntry.matchesPlayed++;
      awayEntry.matchesPlayed++;

      // Update goals
      homeEntry.goalsFor += fixture.homeScore;
      homeEntry.goalsAgainst += fixture.awayScore;
      awayEntry.goalsFor += fixture.awayScore;
      awayEntry.goalsAgainst += fixture.homeScore;

      // Update points and results
      if (fixture.result === 'home') {
        homeEntry.wins++;
        homeEntry.points += 3;
        awayEntry.losses++;
      } else if (fixture.result === 'away') {
        awayEntry.wins++;
        awayEntry.points += 3;
        homeEntry.losses++;
      } else if (fixture.result === 'draw') {
        homeEntry.draws++;
        awayEntry.draws++;
        homeEntry.points++;
        awayEntry.points++;
      }
    }

    console.timeLog('GroupStageCalculation', 'Fixtures processed');

    // Bulk database update
    const bulkOps = Array.from(standingsMap.values()).map(standing => ({
      updateOne: {
        filter: {
          competition: standing.competition,
          player: standing.player,
          group: standing.group
        },
        update: {
          $set: {
            ...standing,
            lastUpdated: new Date()
          }
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await Standing.bulkWrite(bulkOps, { ordered: false });
    }

    console.timeLog('GroupStageCalculation', 'Database updated');

    // Group and sort results efficiently
    const result = {};
    Array.from(standingsMap.values()).forEach(standing => {
      if (!result[standing.group]) {
        result[standing.group] = [];
      }
      result[standing.group].push(standing);
    });

    // Sort all groups at once
    Object.keys(result).forEach(group => {
      result[group].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const bGD = b.goalsFor - b.goalsAgainst;
        const aGD = a.goalsFor - a.goalsAgainst;
        if (bGD !== aGD) return bGD - aGD;
        return b.goalsFor - a.goalsFor;
      });
    });

    console.timeEnd('GroupStageCalculation');
    return result;

  } catch (error) {
    console.error('Group stage standings calculation failed:', error);
    throw error;
  }
};

// Optimized helper functions
const getAllGroupStandings = async (competitionId) => {
  try {
    // Single query with proper indexing
    const [competition, standings] = await Promise.all([
      Competition.findById(competitionId).select('type name').lean(),
      Standing.find({ competition: competitionId })
        .select('-__v -_id')
        .sort({ group: 1, points: -1, goalsFor: -1 })
        .lean()
    ]);
    
    if (!competition || competition.type !== 'GROUP_STAGE') {
      throw new Error('Competition not found or not a group stage competition');
    }

    // Group standings efficiently
    const groupedStandings = {};
    standings.forEach(standing => {
      if (!groupedStandings[standing.group]) {
        groupedStandings[standing.group] = [];
      }
      groupedStandings[standing.group].push(standing);
    });

    return {
      type: 'GROUP_STAGE',
      competitionId,
      competitionName: competition.name,
      standings: groupedStandings
    };
  } catch (error) {
    console.error('Error fetching all group standings:', error);
    throw error;
  }
};

const getGroupStandings = async (competitionId, groupName) => {
  try {
    const standings = await Standing.find({
      competition: competitionId,
      group: groupName
    })
    .select('-__v -_id')
    .sort({ points: -1, goalsFor: -1 })
    .lean();

    return standings;
  } catch (error) {
    console.error('Error fetching group standings:', error);
    throw error;
  }
};

const getGroupQualifiers = async (competitionId, qualifiersPerGroup = 2) => {
  try {
    const allStandings = await getAllGroupStandings(competitionId);
    const qualifiers = [];

    Object.keys(allStandings.standings).forEach(groupName => {
      const groupStandings = allStandings.standings[groupName];
      const groupQualifiers = groupStandings
        .slice(0, qualifiersPerGroup)
        .map((standing, index) => ({
          ...standing,
          groupName,
          groupPosition: index + 1
        }));
      
      qualifiers.push(...groupQualifiers);
    });

    return qualifiers;
  } catch (error) {
    console.error('Error getting group qualifiers:', error);
    throw error;
  }
};

module.exports = { 
  calculateStandings,
  calculateLeagueStandings,
  calculateGroupStageStandings,
  getGroupStandings,
  getAllGroupStandings,
  getGroupQualifiers
};
