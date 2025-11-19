//standingCalculator.js

const Fixture = require('../models/Fixture');
const Competition = require('../models/Competition');
const Standing = require('../models/Standing');
const mongoose = require('mongoose');
const Player = require('../models/Player');

const calculateStandings = async (competitionId, requestId = 'N/A') => {
  console.log(`[${requestId}] START calculateStandings for ${competitionId}`);
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
    // 2. Get completed fixtures
    const fixtures = await Fixture.find({
      competitionId,
      status: 'completed'
    }).lean();

    // 3. Get existing standings
    const existingStandings = await Standing.find({ competition: competitionId })
      .select('player playerName')
      .lean();

    // 4. Initialize standings map
    const standingsMap = new Map();
    
    // Helper to create a blank entry safely
    const createEntry = async (playerId) => {
      const existing = existingStandings.find(s => s.player && s.player.equals(playerId));
      let playerName = 'Unknown Player';
      
      if (existing?.playerName) {
        playerName = existing.playerName;
      } else {
        // Only fetch from DB if we absolutely have to (prevents spamming DB)
        const globalPlayer = await Player.findById(playerId).select('name').lean();
        if (globalPlayer) playerName = globalPlayer.name;
      }

      return {
        competition: new mongoose.Types.ObjectId(competitionId),
        player: playerId, // Keep as ID for now, cast later if needed
        playerName: playerName,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      };
    };

    // Pre-fill with known competition players
    if (competition.players && competition.players.length > 0) {
      for (const playerId of competition.players) {
        standingsMap.set(playerId.toString(), await createEntry(playerId));
      }
    }

    // 5. Process fixtures
    // We use a standard for...of loop to allow await inside if we need to fetch a missing player
    for (const fixture of fixtures) {
      const homeId = fixture.homePlayer.toString();
      const awayId = fixture.awayPlayer.toString();

      // SELF-HEALING: If player is in fixture but not map, add them now!
      if (!standingsMap.has(homeId)) {
        console.log(`[Auto-Fix] Found player ${homeId} in fixture but not in competition list. Adding...`);
        standingsMap.set(homeId, await createEntry(fixture.homePlayer));
      }
      if (!standingsMap.has(awayId)) {
        console.log(`[Auto-Fix] Found player ${awayId} in fixture but not in competition list. Adding...`);
        standingsMap.set(awayId, await createEntry(fixture.awayPlayer));
      }

      const homeEntry = standingsMap.get(homeId);
      const awayEntry = standingsMap.get(awayId);

      // Safety check: If we STILL don't have entries (e.g. null IDs), skip
      if (!homeEntry || !awayEntry) continue;

      // Update match counts
      homeEntry.matchesPlayed++;
      awayEntry.matchesPlayed++;

      // Update goals
      homeEntry.goalsFor += (fixture.homeScore || 0);
      homeEntry.goalsAgainst += (fixture.awayScore || 0);
      awayEntry.goalsFor += (fixture.awayScore || 0);
      awayEntry.goalsAgainst += (fixture.homeScore || 0);

      // Update points and results
      // Ensure numbers are treated as numbers
      const result = fixture.result || 
                     (fixture.homeScore > fixture.awayScore ? 'home' : 
                      fixture.awayScore > fixture.homeScore ? 'away' : 'draw');

      switch (result) {
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
    }

    // 6. Prepare bulk operations
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
    if (bulkOps.length > 0) {
        await Standing.bulkWrite(bulkOps, { ordered: false });
    }

    // Return sorted standings
    return Array.from(standingsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const bGD = (b.goalsFor - b.goalsAgainst);
      const aGD = (a.goalsFor - a.goalsAgainst);
      return bGD !== aGD ? bGD - aGD : b.goalsFor - a.goalsFor;
    });

  } catch (error) {
    console.error('League standings calculation failed:', error);
    throw error;
  }
};

const { performance } = require('perf_hooks');

const calculateGroupStageStandings = async (competitionId, competition) => {
  const overallStart = performance.now();
  let timings = {
    fetchFixtures: 0,
    fetchStandings: 0,
    groupFixtures: 0,
    allFixtures: 0,
    playerMapping: 0,
    initStandings: 0,
    processFixtures: 0,
    bulkOps: 0,
    dbUpdate: 0,
    sorting: 0
  };

  try {
    const fixturesStart = performance.now();
    // Fetch all fixtures (not just completed) to get all participants.
    const allFixtures = await Fixture.find({ competitionId })
      .select('homePlayer awayPlayer homeScore awayScore result round status')
      .lean();
    timings.fetchFixtures = performance.now() - fixturesStart;

    if (allFixtures.length === 0) {
      console.log('No fixtures found for this competition.');
      return [];
    }

    // Filter for completed fixtures to process results.
    const completedFixtures = allFixtures.filter(f => f.status === 'completed');

    const standingsStart = performance.now();
    const existingStandings = await Standing.find({ competition: competitionId })
      .select('player playerName group -_id')
      .lean();
    timings.fetchStandings = performance.now() - standingsStart;

    const groupStart = performance.now();
    const fixturesByGroup = new Map();
    completedFixtures.forEach(fixture => {
      const group = fixture.round;
      if (!fixturesByGroup.has(group)) {
        fixturesByGroup.set(group, []);
      }
      fixturesByGroup.get(group).push(fixture);
    });
    timings.groupFixtures = performance.now() - groupStart;

    const mappingStart = performance.now();
    const playerGroupMap = new Map();
    const playerIds = new Set();

    // Use all fixtures to map every player.
    allFixtures.forEach(fixture => {
      playerGroupMap.set(fixture.homePlayer.toString(), fixture.round);
      playerGroupMap.set(fixture.awayPlayer.toString(), fixture.round);
      playerIds.add(fixture.homePlayer.toString());
      playerIds.add(fixture.awayPlayer.toString());
    });
    timings.playerMapping = performance.now() - mappingStart;

    const initStart = performance.now();
    const standingsMap = new Map();
    const uniquePlayerIds = Array.from(playerIds).map(id => new mongoose.Types.ObjectId(id));

    const players = await Player.find(
      { _id: { $in: uniquePlayerIds } },
      { name: 1 }
    ).lean();
    
    const playerNameMap = new Map(players.map(p => [p._id.toString(), p.name]));

    // Initialize standings for all players with 0 values.
    for (const playerId of playerIds) {
      const group = playerGroupMap.get(playerId);
      if (group) {
        const existing = existingStandings.find(s => 
          s.player.toString() === playerId && s.group === group
        );
        
        const standingKey = `${playerId}_${group}`;
        standingsMap.set(standingKey, {
          competition: new mongoose.Types.ObjectId(competitionId),
          player: new mongoose.Types.ObjectId(playerId),
          playerName: existing?.playerName || playerNameMap.get(playerId) || 'Unknown Player',
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
    timings.initStandings = performance.now() - initStart;

    // Process results from completed fixtures.
    const processStart = performance.now();
    fixturesByGroup.forEach((groupFixtures, group) => {
      groupFixtures.forEach(fixture => {
        const homeKey = `${fixture.homePlayer.toString()}_${group}`;
        const awayKey = `${fixture.awayPlayer.toString()}_${group}`;
        
        const homeEntry = standingsMap.get(homeKey);
        const awayEntry = standingsMap.get(awayKey);

        if (!homeEntry || !awayEntry) return;

        homeEntry.matchesPlayed++;
        awayEntry.matchesPlayed++;
        homeEntry.goalsFor += fixture.homeScore;
        homeEntry.goalsAgainst += fixture.awayScore;
        awayEntry.goalsFor += fixture.awayScore;
        awayEntry.goalsAgainst += fixture.homeScore;

        if (fixture.result === 'home') {
          homeEntry.wins++;
          homeEntry.points += 3;
          awayEntry.losses++;
        } else if (fixture.result === 'away') {
          awayEntry.wins++;
          awayEntry.points += 3;
          homeEntry.losses++;
        } else {
          homeEntry.draws++;
          awayEntry.draws++;
          homeEntry.points++;
          awayEntry.points++;
        }
      });
    });
    timings.processFixtures = performance.now() - processStart;

    const bulkStart = performance.now();
    const bulkOps = [];
    standingsMap.forEach(standing => {
      bulkOps.push({
        updateOne: {
          filter: {
            competition: standing.competition,
            player: standing.player,
            group: standing.group
          },
          update: {
            $set: {
              matchesPlayed: standing.matchesPlayed,
              wins: standing.wins,
              draws: standing.draws,
              losses: standing.losses,
              goalsFor: standing.goalsFor,
              goalsAgainst: standing.goalsAgainst,
              points: standing.points,
              lastUpdated: new Date()
            },
            $setOnInsert: {
              playerName: standing.playerName
            }
          },
          upsert: true
        }
      });
    });
    timings.bulkOps = performance.now() - bulkStart;

    const dbStart = performance.now();
    if (bulkOps.length > 0) {
      await Standing.bulkWrite(bulkOps, { ordered: false });
    }
    timings.dbUpdate = performance.now() - dbStart;

    const sortStart = performance.now();
    const result = {};
    standingsMap.forEach(standing => {
      const group = standing.group;
      if (!result[group]) result[group] = [];
      result[group].push(standing);
    });

    Object.values(result).forEach(group => {
      group.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const bGD = b.goalsFor - b.goalsAgainst;
        const aGD = a.goalsFor - a.goalsAgainst;
        if (bGD !== aGD) return bGD - aGD;
        return b.goalsFor - a.goalsFor;
      });
    });
    timings.sorting = performance.now() - sortStart;

    const totalTime = performance.now() - overallStart;
    console.log('Standings calculation timings:');
    Object.entries(timings).forEach(([key, val]) => {
      console.log(`- ${key}: ${val.toFixed(2)}ms`);
    });
    console.log(`Total time: ${totalTime.toFixed(2)}ms`);
    
    return result;

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
