const Fixture = require('../models/Fixture');
const Competition = require('../models/Competition');
const Standing = require('../models/Standing');
const mongoose = require('mongoose');
const Player = require('../models/Player');
const calculateStandings = async (competitionId) => {
  try {
    // 1. Get competition WITHOUT populating players
    const competition = await Competition.findById(competitionId)
      .select('players')
      .lean();

    if (!competition) throw new Error('Competition not found');
    if (!competition.players?.length) throw new Error('No players in competition');

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
    console.error('Standings calculation failed:', error);
    throw error;
  }
};

module.exports = { calculateStandings };