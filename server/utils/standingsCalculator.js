const Fixture = require('../models/Fixture');
const Competition = require('../models/Competition');
const Standing = require('../models/Standing');
const mongoose = require('mongoose');
const Player = require('../models/Player');
const calculateStandings = async (competitionId) => {
  try {
    // 1. Validate competition and players
    const competition = await Competition.findById(competitionId)
      .select('players')
      .populate('players', 'name')
      .lean();

    if (!competition) throw new Error('Competition not found');
    if (!competition.players?.length) throw new Error('No players in competition');

    // 2. Get completed fixtures with player data
    const fixtures = await Fixture.find({
      competitionId,
      status: 'completed'
    })
      .populate('homePlayer awayPlayer', 'name _id')
      .lean();

    // 3. Initialize standings map with player data
    const standingsMap = new Map();
   const validPlayers = await Player.find({ 
  _id: { $in: competition.players }
});

    competition.players.forEach(player => {
        if (!validPlayers.some(vp => vp._id.equals(player._id))) return;

      standingsMap.set(player._id.toString(), {
        competition: new mongoose.Types.ObjectId(competitionId),
        player: player._id,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      });
    });

    // 4. Process fixtures
    fixtures.forEach(fixture => {
      const homeId = fixture.homePlayer._id.toString();
      const awayId = fixture.awayPlayer._id.toString();

      const home = standingsMap.get(homeId);
      const away = standingsMap.get(awayId);

      // Update match counts
      home.matchesPlayed++;
      away.matchesPlayed++;

      // Update goals
      home.goalsFor += fixture.homeScore;
      home.goalsAgainst += fixture.awayScore;
      away.goalsFor += fixture.awayScore;
      away.goalsAgainst += fixture.homeScore;

      // Update points and results
      switch (fixture.result) {
        case 'home':
          home.wins++;
          home.points += 3;
          away.losses++;
          break;
        case 'away':
          away.wins++;
          away.points += 3;
          home.losses++;
          break;
        case 'draw':
          home.draws++;
          away.draws++;
          home.points++;
          away.points++;
          break;
      }

      standingsMap.set(homeId, home);
      standingsMap.set(awayId, away);
    });

    // 5. Prepare for database update
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

    // 6. Update database
    await Standing.bulkWrite(bulkOps, { ordered: false });

    // 7. Return sorted standings
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