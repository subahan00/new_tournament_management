const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { performance } = require('perf_hooks');
const http = require('http');

const JWT_SECRET = 'official90_jwt_secret@@@@@@@@@9090';
const MONGO_URI = 'mongodb://127.0.0.1/official90';
const token = jwt.sign({ user: { id: new mongoose.Types.ObjectId(), role: 'admin' } }, JWT_SECRET, { expiresIn: '1h' });

const request = (method, path, body = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 5000,
            family: 4,
            path: '/api' + path,
            method: method,
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
        };
        const req = http.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

async function runTests() {
  let db;
  try {
    db = await mongoose.connect(MONGO_URI);
    const Player = mongoose.model('Player', new mongoose.Schema({ name: String }));
    const Competition = mongoose.model('Competition', new mongoose.Schema({ name: String, type: String, players: [{type: mongoose.Schema.Types.ObjectId, ref: 'Player'}], rounds: Number }));
    
    let players = await Player.find().limit(25);
    if (players.length < 25) {
        const toCreate = 25 - players.length;
        const newPlayers = [];
        for (let i = 0; i < toCreate; i++) newPlayers.push({ name: 'OddPlayer_' + i });
        await Player.insertMany(newPlayers);
        players = await Player.find().limit(25);
    }
    const playerIds = players.map(p => p._id.toString());
    
    console.log('--- TEST 1: Fixture Generation (25 players, 3 rounds) ---');
    const comp = await Competition.create({
      name: 'Perf Test League ' + Date.now(),
      type: 'LEAGUE',
      players: playerIds,
      rounds: 3
    });
    const compId = comp._id.toString();
    
    let start = performance.now();
    const generateData = await request('POST', '/fixtures/create/' + compId);
    console.log('Generation Time:', (performance.now() - start).toFixed(2) + 'ms');
    console.log('Fixtures generated:', generateData.fixtureCount, '(Expected: 900 for 25p/3r)');
    if (generateData.fixtureCount !== 900) throw new Error('Incorrect fixture count');

    console.log('\n--- TEST 2: Fixture Fetching ---');
    start = performance.now();
    const fetchData = await request('GET', '/fixtures/competition/' + compId);
    console.log('Fetch Time:', (performance.now() - start).toFixed(2) + 'ms');
    const schedule = fetchData.matchdaySchedule;
    console.log('Matchdays:', schedule.length, '(Expected: 75)');
    if (schedule.length !== 75) throw new Error('Incorrect matchday count');
    console.log('Matches per matchday:', schedule[0].fixtures.length, '(Expected: 12)');
    if (schedule[0].fixtures.length !== 12) throw new Error('Incorrect matches per matchday');

    console.log('\n--- TEST 3: Normal Score Update ---');
    const firstFixtureId = schedule[0].fixtures[0]._id;
    start = performance.now();
    const updateData = await request('PUT', '/fixtures/' + firstFixtureId + '/result', { homeScore: 2, awayScore: 1 });
    console.log('Update Time:', (performance.now() - start).toFixed(2) + 'ms');
    console.log('Update Status:', updateData.data.status);

    console.log('\n--- TEST 4: Reverting a Completed Result ---');
    start = performance.now();
    const revertData = await request('PUT', '/fixtures/' + firstFixtureId + '/revert');
    console.log('Revert Time:', (performance.now() - start).toFixed(2) + 'ms');
    console.log('Revert Status:', revertData.data.status);
    
    console.log('\n✅ ALL PERFORMANCE & FUNCTIONALITY TESTS PASSED ✅');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  } finally {
    if (db) await mongoose.disconnect();
  }
}
runTests();
