const mongoose = require('mongoose');
const Competition = require('./models/Competition');
const Clan = require('./models/Clan');
const Player = require('./models/Player');
const Fixture = require('./models/Fixture');
const { generateClanWarRound } = require('./utils/fixtureGenerator');
const competitionController = require('./controllers/competitionController');

async function runTest() {
  await mongoose.connect('mongodb://127.0.0.1/official90');
  console.log('Connected to MongoDB');

  try {
    // 1. Create a competition
    const competition = new Competition({
      name: 'Test Clan War',
      type: 'CLAN_WAR',
      numberOfClans: 2,
      numberOfPlayers: 10,
      players: [],
      clans: [],
      playersPerClan: 5
    });
    await competition.save();

    // 2. Create players & clans
    const clanIds = [];
    const playerIds = [];
    
    for (let i = 1; i <= 2; i++) {
      const clanPlayers = [];
      for (let j = 1; j <= 5; j++) {
        const player = new Player({ name: `Clan${i} Player${j}`, competitionId: competition._id });
        await player.save();
        clanPlayers.push(player._id);
        playerIds.push(player._id);
      }
      
      const clan = new Clan({
        name: `Test Clan ${i}`,
        competitionId: competition._id,
        members: clanPlayers
      });
      await clan.save();
      clanIds.push(clan._id);
    }
    
    competition.players = playerIds;
    competition.clans = clanIds;
    await competition.save();

    // 3. Generate fixtures
    await generateClanWarRound(competition._id, clanIds, 'Round 1');
    
    let fixtures = await Fixture.find({ competitionId: competition._id });
    console.log(`Initial Fixture count: ${fixtures.length}, Matches in fixture: ${fixtures[0].individualMatches.length}`);
    if (fixtures[0].individualMatches.length !== 5) throw new Error("Expected 5 matches initially");

    // 4. Test 5 -> 4 transition
    const clan1 = await Clan.findById(clanIds[0]);
    const clan2 = await Clan.findById(clanIds[1]);
    
    const req5to4 = {
      params: { id: competition._id },
      body: {
        newCount: 4,
        modifications: [
          { clanId: clanIds[0], playerIdToRemove: clan1.members[4] },
          { clanId: clanIds[1], playerIdToRemove: clan2.members[4] }
        ]
      }
    };
    const res5to4 = {
      json: (data) => console.log('5->4 Response:', data),
      status: (code) => ({ json: (data) => console.log('5->4 Error:', code, data) })
    };
    
    await competitionController.changeParticipantCount(req5to4, res5to4);
    
    fixtures = await Fixture.find({ competitionId: competition._id });
    console.log(`After 5->4: Matches in fixture: ${fixtures[0].individualMatches.length}`);
    if (fixtures[0].individualMatches.length !== 4) throw new Error("Expected 4 matches after 5->4 transition");

    // 5. Test 4 -> 5 transition
    const req4to5 = {
      params: { id: competition._id },
      body: {
        newCount: 5,
        modifications: [
          { clanId: clanIds[0], newPlayerName: 'Clan1 New Player' },
          { clanId: clanIds[1], newPlayerName: 'Clan2 New Player' }
        ]
      }
    };
    const res4to5 = {
      json: (data) => console.log('4->5 Response:', data),
      status: (code) => ({ json: (data) => console.log('4->5 Error:', code, data) })
    };
    
    await competitionController.changeParticipantCount(req4to5, res4to5);
    
    fixtures = await Fixture.find({ competitionId: competition._id });
    console.log(`After 4->5: Matches in fixture: ${fixtures[0].individualMatches.length}`);
    if (fixtures[0].individualMatches.length !== 5) throw new Error("Expected 5 matches after 4->5 transition");

    // Print the names of the paired players in the last match
    const lastMatch = fixtures[0].individualMatches[4];
    console.log(`New paired match: ${lastMatch.homePlayerName} vs ${lastMatch.awayPlayerName}`);

    console.log('All tests passed successfully!');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    // Cleanup
    await Competition.deleteMany({ name: 'Test Clan War' });
    await Clan.deleteMany({ name: { $regex: /^Test Clan/ } });
    await Player.deleteMany({ name: { $regex: /^Clan[12] (Player|New)/ } });
    
    mongoose.disconnect();
  }
}

runTest();
