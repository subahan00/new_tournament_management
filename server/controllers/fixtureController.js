const Fixture = require('../models/Fixture');
const Competition = require('../models/Competition');
const { generateLeagueFixtures } = require('../utils/fixtureGenerator');
const Player = require('../models/Player');

// Helper: Schedule matches across weeks
function calculateMatchDate(fixtureIndex) {
  const startDate = new Date();
  const weeksToAdd = Math.floor(fixtureIndex / 10); // 10 matches per week
  startDate.setDate(startDate.getDate() + (weeksToAdd * 7));
  return startDate;
}

exports.createFixturesForLeague = async (req, res) => {
  const { competitionId } = req.params;

  try {
    // 1. Validate Competition
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    // 2. Check Competition Type
    const allowedTypes = ['ELITE_LEAGUE', 'PRO_LEAGUE', 'SUPER_LEAGUE', 'ROOKIE_LEAGUE', 'FRIENDLY_LEAGUE', 'LEAGUE'];
    if (!allowedTypes.includes(competition.type)) {
      return res.status(400).json({ 
        error: 'Fixtures can only be generated for league-type competitions',
        allowedTypes 
      });
    }

    // 3. Validate Players
    const players = await Player.find({ _id: { $in: competition.players } });
    if (players.length < 2) {
      return res.status(400).json({ error: 'Not enough players to create fixtures' });
    }
    if (players.length > 20) {
      return res.status(400).json({ 
        error: 'Maximum 20 players supported',
        playerCount: players.length 
      });
    }

    console.log(`Generating fixtures for ${players.length} players...`);

    // 4. Generate Fixtures (Triple Round-Robin)
    const fixturesData = generateLeagueFixtures(players.map(p => p._id));
    console.log(`Generated ${fixturesData.length} fixtures`);

    // 5. Prepare for DB Insert
    const fixturesWithMeta = fixturesData.map((f, index) => ({
      ...f,
      competitionId,
      matchDate: calculateMatchDate(index),
      status: 'pending'
    }));

    // 6. Batch Insert (Prevent Overload)
    const BATCH_SIZE = 50;
    for (let i = 0; i < fixturesWithMeta.length; i += BATCH_SIZE) {
      await Fixture.insertMany(fixturesWithMeta.slice(i, i + BATCH_SIZE));
      console.log(`Inserted batch ${i / BATCH_SIZE + 1}`);
    }

    // 7. Update Competition
    competition.status = 'ongoing';
    competition.fixtureGeneratedAt = new Date();
    await competition.save();

    res.status(201).json({ 
      success: true,
      message: `${fixturesData.length} fixtures generated successfully`,
      fixtureCount: fixturesData.length
    });

  } catch (err) {
    console.error('❌ Fixture Generation Error:', {
      error: err.message,
      stack: err.stack,
      competitionId
    });
    
    res.status(500).json({ 
      error: 'Failed to generate fixtures',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.getOngoingCompetitions = async (req, res) => {
  try {
    const competitions = await Competition.find({ status: 'ongoing' })
      .select('name type startDate');
    res.json(competitions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCompetitionFixtures = async (req, res) => {
  try {
    const fixtures = await Fixture.find({
      competitionId: req.params.competitionId
    })
    .populate('homePlayer awayPlayer', 'name')
    .sort('matchDate round');
    
    res.json(fixtures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateFixtureResult = async (req, res) => {
  try {
    const { fixtureId } = req.params;
    const { homeScore, awayScore } = req.body;

    // Validate inputs
    if (typeof homeScore !== 'number' || typeof awayScore !== 'number') {
      return res.status(400).json({ error: 'Scores must be numbers' });
    }

    // Calculate result
    const result = 
      homeScore > awayScore ? 'home' :
      awayScore > homeScore ? 'away' : 'draw';

    // Update fixture
    const updatedFixture = await Fixture.findByIdAndUpdate(
      fixtureId,
      {
        homeScore,
        awayScore,
        status: 'completed',
        result,
        completedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedFixture) {
      return res.status(404).json({ error: 'Fixture not found' });
    }

    // Update standings (implement your logic)
   

    res.json({
      success: true,
      fixture: updatedFixture
    });
    const standings = await calculateStandings(fixture.competitionId);
    io.emit('standings_update', {
      competitionId: fixture.competitionId,
      standings
    });
    
      res.json({ 
      fixture: updatedFixture,
      standings 
    });

  } catch (err) {
    console.error('Update result error:', {
      error: err.message,
      stack: err.stack,
      body: req.body
    });
    res.status(500).json({ 
      error: 'Failed to update result',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};