const Fixture = require('../models/Fixture');
const Competition = require('../models/Competition');
const Standing = require('../models/Standing');
const mongoose = require('mongoose');
const Player = require('../models/Player');

const calculateStandings = async (competitionId) => {
  try {
    // 1. Get competition WITHOUT populating players
    const competition = await Competition.findById(competitionId)
      .select('players type')
      .lean();

    if (!competition) throw new Error('Competition not found');
    if (!competition.players?.length) throw new Error('No players in competition');

    // Check competition type and route to appropriate function
    if (competition.type === 'GROUP_STAGE') {
      console.log('Calculating group stage standings for competition:', competitionId);
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
    // 2. Get completed fixtures WITHOUT player population
    const fixtures = await Fixture.find({
      competitionId,
      status: 'completed'
    }).lean();

    // 3. Get existing standings for competition-specific names
    const existingStandings = await Standing.find({ competition: competitionId })
      .select('player playerName')
      .lean();

    // 4. Initialize standings with competition-specific names
    const standingsMap = new Map();
    
    // Create base standings using existing names or global names
    for (const playerId of competition.players) {
      const existing = existingStandings.find(s => s.player.equals(playerId));
      const globalPlayer = await Player.findById(playerId).select('name').lean();

      standingsMap.set(playerId.toString(), {
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
    }

    // 5. Process fixtures using competition-specific names
    fixtures.forEach(fixture => {
      const homeEntry = standingsMap.get(fixture.homePlayer.toString());
      const awayEntry = standingsMap.get(fixture.awayPlayer.toString());

      // Update match counts
      homeEntry.matchesPlayed++;
      awayEntry.matchesPlayed++;

      // Update goals using FIXTURE STORED NAMES
      homeEntry.goalsFor += fixture.homeScore;
      homeEntry.goalsAgainst += fixture.awayScore;
      awayEntry.goalsFor += fixture.awayScore;
      awayEntry.goalsAgainst += fixture.homeScore;

      // Update points and results
      switch (fixture.result) {
        case 'home':
          homeEntry.wins++;
          homeEntry.points += 3;
          awayEntry.losses++;
          break;
        case 'away':
          awayEntry.wins++;
          awayEntry.points += 3;
          homeEntry.losses++;
          break;
        case 'draw':
          homeEntry.draws++;
          awayEntry.draws++;
          homeEntry.points++;
          awayEntry.points++;
          break;
      }

      // Preserve existing names
      homeEntry.playerName = homeEntry.playerName;
      awayEntry.playerName = awayEntry.playerName;
    });

    // 6. Prepare bulk operations with name preservation
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

    // 7. Update database
    await Standing.bulkWrite(bulkOps, { ordered: false });

    // Return sorted standings with competition names
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
    // 1. Get completed fixtures WITHOUT player population
    const fixtures = await Fixture.find({
      competitionId,
      status: 'completed'
    }).lean();

    if (fixtures.length === 0) {
      console.log('No completed fixtures found for group stage calculation');
      return [];
    }

    // 2. Get existing standings for competition-specific names
    const existingStandings = await Standing.find({ competition: competitionId })
      .select('player playerName group')
      .lean();

    // 3. Group fixtures by round (group)
    const fixturesByGroup = fixtures.reduce((acc, fixture) => {
      const group = fixture.round;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(fixture);
      return acc;
    }, {});

    // 4. Get all fixtures (including pending) to determine group memberships
    const allFixtures = await Fixture.find({
      competitionId
    }).lean();

    // Create player-group mapping from all fixtures
    const playerGroupMap = new Map();
    allFixtures.forEach(fixture => {
      const group = fixture.round;
      playerGroupMap.set(fixture.homePlayer.toString(), group);
      playerGroupMap.set(fixture.awayPlayer.toString(), group);
    });

    // 5. Initialize standings map for ALL players in competition with 0 values
    const standingsMap = new Map();

    // Initialize standings for ALL players in the competition
    for (const playerId of competition.players) {
      const playerIdStr = playerId.toString();
      const group = playerGroupMap.get(playerIdStr);
      
      if (group) {
        const existing = existingStandings.find(s => 
          s.player.equals(playerId) && s.group === group
        );
        const globalPlayer = await Player.findById(playerId).select('name').lean();

        const standingKey = `${playerIdStr}_${group}`;
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
    }

    // 6. Process completed fixtures and update standings
    Object.entries(fixturesByGroup).forEach(([group, groupFixtures]) => {
      groupFixtures.forEach(fixture => {
        const homeKey = `${fixture.homePlayer.toString()}_${group}`;
        const awayKey = `${fixture.awayPlayer.toString()}_${group}`;
        
        const homeEntry = standingsMap.get(homeKey);
        const awayEntry = standingsMap.get(awayKey);

        if (!homeEntry || !awayEntry) {
          console.warn(`Missing standings entry for fixture: ${fixture._id}`);
          return;
        }

        // Update match counts
        homeEntry.matchesPlayed++;
        awayEntry.matchesPlayed++;

        // Update goals
        homeEntry.goalsFor += fixture.homeScore;
        homeEntry.goalsAgainst += fixture.awayScore;
        awayEntry.goalsFor += fixture.awayScore;
        awayEntry.goalsAgainst += fixture.homeScore;

        // Update points and results
        switch (fixture.result) {
          case 'home':
            homeEntry.wins++;
            homeEntry.points += 3;
            awayEntry.losses++;
            break;
          case 'away':
            awayEntry.wins++;
            awayEntry.points += 3;
            homeEntry.losses++;
            break;
          case 'draw':
            homeEntry.draws++;
            awayEntry.draws++;
            homeEntry.points++;
            awayEntry.points++;
            break;
        }
      });
    });

    // 7. Prepare bulk operations
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

    // 8. Update database
    if (bulkOps.length > 0) {
      await Standing.bulkWrite(bulkOps, { ordered: false });
    }

    // 9. Return sorted standings grouped by group
    const result = {};
    
    // Group standings by group and sort each group
    Array.from(standingsMap.values()).forEach(standing => {
      if (!result[standing.group]) {
        result[standing.group] = [];
      }
      result[standing.group].push(standing);
    });

    // Sort each group's standings
    Object.keys(result).forEach(group => {
      result[group].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const bGD = b.goalsFor - b.goalsAgainst;
        const aGD = a.goalsFor - a.goalsAgainst;
        if (bGD !== aGD) return bGD - aGD;
        return b.goalsFor - a.goalsFor;
      });
    });

    // Return flat array of all standings or grouped object based on your preference
    // Option 1: Return grouped object
    return result;
    
    // Option 2: Return flat array (uncomment if preferred)
    // return Array.from(standingsMap.values()).sort((a, b) => {
    //   // First sort by group, then by standings within group
    //   if (a.group !== b.group) return a.group.localeCompare(b.group);
    //   if (b.points !== a.points) return b.points - a.points;
    //   const bGD = b.goalsFor - b.goalsAgainst;
    //   const aGD = a.goalsFor - a.goalsAgainst;
    //   if (bGD !== aGD) return bGD - aGD;
    //   return b.goalsFor - a.goalsFor;
    // });

  } catch (error) {
    console.error('Group stage standings calculation failed:', error);
    throw error;
  }
};

// Helper function to get standings for a specific group
const getGroupStandings = async (competitionId, groupName) => {
  try {
    const standings = await Standing.find({
      competition: competitionId,
      group: groupName
    }).sort({ position: 1 }).lean();

    return standings;
  } catch (error) {
    console.error('Error fetching group standings:', error);
    throw error;
  }
};

// Helper function to get all group standings for a competition
const getAllGroupStandings = async (competitionId) => {
  try {
    const competition = await Competition.findById(competitionId).select('type').lean();
    
    if (!competition || competition.type !== 'GROUP_STAGE') {
      throw new Error('Competition not found or not a group stage competition');
    }

    const standings = await Standing.find({
      competition: competitionId
    }).sort({ group: 1, position: 1 }).lean();

    // Group standings by group name
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
      groups: groupedStandings
    };
  } catch (error) {
    console.error('Error fetching all group standings:', error);
    throw error;
  }
};

// Helper function to get top qualifiers from each group
const getGroupQualifiers = async (competitionId, qualifiersPerGroup = 2) => {
  try {
    const allStandings = await getAllGroupStandings(competitionId);
    const qualifiers = [];

    Object.keys(allStandings.groups).forEach(groupName => {
      const groupStandings = allStandings.groups[groupName];
      const groupQualifiers = groupStandings
        .slice(0, qualifiersPerGroup)
        .map(standing => ({
          ...standing,
          groupName,
          groupPosition: standing.position
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
