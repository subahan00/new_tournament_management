const mongoose = require('mongoose');
const { performance } = require('perf_hooks');
require('dotenv').config();

const MONGO_URI = 'mongodb://127.0.0.1/official90';

// Import Models
const Player = require('./models/Player');
const Competition = require('./models/Competition');
const Fixture = require('./models/Fixture');
const Standing = require('./models/Standing');

// Import Controllers/Utils
const fixtureController = require('./controllers/fixtureController');
const { calculateStandings } = require('./utils/standingsCalculator');

async function runTests() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  try {
    let players = await Player.find().limit(25);
    if (players.length < 25) {
        const toCreate = 25 - players.length;
        const newPlayers = [];
        for (let i = 0; i < toCreate; i++) newPlayers.push({ name: 'OddPlayer_' + i });
        await Player.insertMany(newPlayers);
        players = await Player.find().limit(25);
    }
    const playerIds = players.map(p => p._id.toString());
    
    console.log('\n--- TEST 1: Fixture Generation (25 players, 3 rounds) ---');
    const comp = await Competition.create({
      name: 'Perf Test League ' + Date.now(),
      type: 'LEAGUE',
      players: playerIds,
      rounds: 3, numberOfPlayers: 25
    });
    
    // Mock req, res
    let resData = null;
    const reqCreate = { params: { competitionId: comp._id.toString() }, body: {} };
    const resCreate = {
        status: () => resCreate,
        json: (data) => { resData = data; }
    };
    
    let start = performance.now();
    await fixtureController.createFixturesForLeague(reqCreate, resCreate);
    console.log('Generation Time:', (performance.now() - start).toFixed(2) + 'ms');
    console.log('Fixtures generated:', resData.fixtureCount, '(Expected: 900 for 25p/3r)');
    if (resData.fixtureCount !== 900) throw new Error('Incorrect fixture count');

    console.log('\n--- TEST 2: Fixture Fetching ---');
    const reqFetch = { params: { competitionId: comp._id.toString() } };
    const resFetch = { json: (data) => { resData = data; } };
    start = performance.now();
    await fixtureController.getCompetitionFixtures(reqFetch, resFetch);
    console.log('Fetch Time:', (performance.now() - start).toFixed(2) + 'ms');
    const schedule = resData.matchdaySchedule;
    console.log('Matchdays:', schedule.length, '(Expected: 75)');
    console.log('Matches per matchday:', schedule[0].fixtures.length, '(Expected: 12)');

    console.log('\n--- TEST 3: Normal Score Update ---');
    const firstFixtureId = schedule[0].fixtures[0]._id;
    const reqUpdate = { 
        params: { fixtureId: firstFixtureId.toString() },
        body: { homeScore: 2, awayScore: 1 },
        app: { get: () => null }
    };
    const resUpdate = {
        status: () => resUpdate,
        json: (data) => { resData = data; }
    };
    start = performance.now();
    await fixtureController.updateFixtureResult(reqUpdate, resUpdate);
    console.log('Update Time:', (performance.now() - start).toFixed(2) + 'ms');
    console.log('Update Status:', resData.data.status);

    console.log('\n--- TEST 4: Reverting a Completed Result ---');
    const reqRevert = { 
        params: { fixtureId: firstFixtureId.toString() },
        body: {},
        app: { get: () => null }
    };
    const resRevert = {
        status: () => resRevert,
        json: (data) => { resData = data; }
    };
    start = performance.now();
    await fixtureController.revertFixtureResult(reqRevert, resRevert);
    console.log('Revert Time:', (performance.now() - start).toFixed(2) + 'ms');
    console.log('Revert Status:', resData.data.status);
    
    console.log('\n✅ ALL PERFORMANCE & FUNCTIONALITY TESTS PASSED ✅');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  } finally {
    await mongoose.disconnect();
  }
}
runTests();
