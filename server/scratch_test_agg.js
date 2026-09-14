const mongoose = require('mongoose');
const { performance } = require('perf_hooks');
require('dotenv').config();

const MONGO_URI = 'mongodb://127.0.0.1/official90';

// Import Models
const Player = require('./models/Player');
const Competition = require('./models/Competition');
const Fixture = require('./models/Fixture');
const Standing = require('./models/Standing');
const { calculateLeagueStandings } = require('./utils/standingsCalculator');

async function testAggregation() {
    await mongoose.connect(MONGO_URI);
    
    // Find the test competition from earlier
    const comp = await Competition.findOne({ name: /Perf Test League/ }).lean();
    if (!comp) throw new Error("No test competition found");
    const competitionId = comp._id;

    // We need to simulate some completed matches
    const fixtures = await Fixture.find({ competitionId });
    console.log(`Found ${fixtures.length} fixtures`);
    
    // Complete first 50 matches randomly
    for(let i=0; i<50; i++) {
        if(fixtures[i].status === 'pending') {
           fixtures[i].homeScore = Math.floor(Math.random() * 5);
           fixtures[i].awayScore = Math.floor(Math.random() * 5);
           fixtures[i].status = 'completed';
           if(fixtures[i].homeScore > fixtures[i].awayScore) fixtures[i].result = 'home';
           else if(fixtures[i].awayScore > fixtures[i].homeScore) fixtures[i].result = 'away';
           else fixtures[i].result = 'draw';
           await fixtures[i].save();
        }
    }

    // 1. Run Original JS logic
    const startJS = performance.now();
    const jsStandings = await calculateLeagueStandings(competitionId, comp);
    const timeJS = performance.now() - startJS;
    
    // 2. Draft Aggregation Logic
    const startAgg = performance.now();
    
    // Pipeline
    const aggResults = await Fixture.aggregate([
      { $match: { competitionId: new mongoose.Types.ObjectId(competitionId), status: 'completed', isDeleted: false } },
      { $project: {
          records: [
             {
               player: "$homePlayer",
               playerName: "$homePlayerName",
               gf: "$homeScore",
               ga: "$awayScore",
               win: { $cond: [{ $gt: ["$homeScore", "$awayScore"] }, 1, 0] },
               draw: { $cond: [{ $eq: ["$homeScore", "$awayScore"] }, 1, 0] },
               loss: { $cond: [{ $lt: ["$homeScore", "$awayScore"] }, 1, 0] },
               pts: { $cond: [{ $gt: ["$homeScore", "$awayScore"] }, 3, { $cond: [{ $eq: ["$homeScore", "$awayScore"] }, 1, 0] }] }
             },
             {
               player: "$awayPlayer",
               playerName: "$awayPlayerName",
               gf: "$awayScore",
               ga: "$homeScore",
               win: { $cond: [{ $gt: ["$awayScore", "$homeScore"] }, 1, 0] },
               draw: { $cond: [{ $eq: ["$homeScore", "$awayScore"] }, 1, 0] },
               loss: { $cond: [{ $lt: ["$awayScore", "$homeScore"] }, 1, 0] },
               pts: { $cond: [{ $gt: ["$awayScore", "$homeScore"] }, 3, { $cond: [{ $eq: ["$homeScore", "$awayScore"] }, 1, 0] }] }
             }
          ]
      }},
      { $unwind: "$records" },
      { $group: {
          _id: "$records.player",
          playerName: { $first: "$records.playerName" },
          matchesPlayed: { $sum: 1 },
          wins: { $sum: "$records.win" },
          draws: { $sum: "$records.draw" },
          losses: { $sum: "$records.loss" },
          goalsFor: { $sum: "$records.gf" },
          goalsAgainst: { $sum: "$records.ga" },
          points: { $sum: "$records.pts" }
      }}
    ]);

    // Zero-fill and map
    const aggMap = new Map();
    aggResults.forEach(r => aggMap.set(r._id.toString(), r));
    
    // Get existing standings for names if needed, or populate comp.players
    const populatedComp = await Competition.findById(competitionId).populate('players', 'name').lean();
    
    const finalAggStandings = [];
    
    for (const player of populatedComp.players) {
       const pid = player._id.toString();
       const stats = aggMap.get(pid);
       finalAggStandings.push({
           competition: new mongoose.Types.ObjectId(competitionId),
           player: player._id,
           playerName: player.name || (stats ? stats.playerName : 'Unknown Player'),
           matchesPlayed: stats ? stats.matchesPlayed : 0,
           wins: stats ? stats.wins : 0,
           draws: stats ? stats.draws : 0,
           losses: stats ? stats.losses : 0,
           goalsFor: stats ? stats.goalsFor : 0,
           goalsAgainst: stats ? stats.goalsAgainst : 0,
           points: stats ? stats.points : 0
       });
    }

    // Sort identical to JS
    finalAggStandings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const bGD = (b.goalsFor - b.goalsAgainst);
      const aGD = (a.goalsFor - a.goalsAgainst);
      return bGD !== aGD ? bGD - aGD : b.goalsFor - a.goalsFor;
    });

    const timeAgg = performance.now() - startAgg;

    // 3. Compare outputs
    console.log(`JS Time: ${timeJS.toFixed(2)}ms`);
    console.log(`Agg Time: ${timeAgg.toFixed(2)}ms`);
    
    // Compare critical values
    let isIdentical = true;
    for(let i=0; i<jsStandings.length; i++) {
        const js = jsStandings[i];
        const agg = finalAggStandings.find(s => s.player.toString() === js.player.toString());
        
        if (!agg || js.points !== agg.points || js.goalsFor !== agg.goalsFor || js.matchesPlayed !== agg.matchesPlayed) {
            console.error('MISMATCH on player', js.playerName);
            console.log('JS:', js);
            console.log('AGG:', agg);
            isIdentical = false;
        }
    }
    
    if (isIdentical) {
        console.log('✅ Standings perfectly identical!');
    } else {
        console.log('❌ Mismatch found!');
    }

    await mongoose.disconnect();
}
testAggregation();
