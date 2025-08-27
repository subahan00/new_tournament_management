// routes/clanWar.js
const express = require('express');
const router = express.Router();
const Competition = require('../models/Competition');
const Fixture = require('../models/Fixture');
const Clan = require('../models/Clan');
const Player = require('../models/Player');

// GET /api/clan-wars - Get all CLAN_WAR competitions
router.get('/', async (req, res) => {
  try {
    const competitions = await Competition.find({ type: 'CLAN_WAR' })
      .populate('winnerClan', 'name')
      .sort({ createdAt: -1 });

    const competitionsWithStats = await Promise.all(
      competitions.map(async (comp) => {
        const clansCount = await Clan.countDocuments({ competitionId: comp._id });
        const completedFixtures = await Fixture.countDocuments({ 
          competitionId: comp._id, 
          status: 'completed',
          isClanWar: true 
        });
        const totalFixtures = await Fixture.countDocuments({ 
          competitionId: comp._id,
          isClanWar: true 
        });

        return {
          ...comp.toObject(),
          clansCount,
          completedFixtures,
          totalFixtures,
          progress: totalFixtures > 0 ? Math.round((completedFixtures / totalFixtures) * 100) : 0
        };
      })
    );

    res.json({
      success: true,
      data: competitionsWithStats
    });
  } catch (error) {
    console.error('Error fetching clan war competitions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clan war competitions',
      error: error.message
    });
  }
});

// GET /api/clan-wars/:id - Get specific clan war competition with fixtures
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get competition details
    const competition = await Competition.findById(id)
      .populate('winnerClan', 'name')
      .populate('clans', 'name points matchesWon matchesDrawn matchesLost isEliminated');

    if (!competition || competition.type !== 'CLAN_WAR') {
      return res.status(404).json({
        success: false,
        message: 'Clan war competition not found'
      });
    }

    // Get all fixtures for this competition
    const fixtures = await Fixture.find({ 
      competitionId: id, 
      isClanWar: true 
    })
      .populate('homeClan', 'name')
      .populate('awayClan', 'name')
      .populate('individualMatches.homePlayer', 'name')
      .populate('individualMatches.awayPlayer', 'name')
      .sort({ round: 1, bracketPosition: 1 });

    // Group fixtures by round
    const fixturesByRound = fixtures.reduce((acc, fixture) => {
      if (!acc[fixture.round]) {
        acc[fixture.round] = [];
      }
      acc[fixture.round].push(fixture);
      return acc;
    }, {});

    // Generate round names based on number of clans
    const totalClans = competition.numberOfClans;
    const roundNames = generateRoundNames(totalClans);

    // Get clan standings
    const clans = await Clan.find({ competitionId: id })
      .populate('members', 'name')
      .sort({ points: -1, matchesWon: -1, name: 1 });

    res.json({
      success: true,
      data: {
        competition: competition.toObject(),
        fixtures: fixturesByRound,
        roundNames,
        clans,
        totalRounds: roundNames.length
      }
    });
  } catch (error) {
    console.error('Error fetching clan war details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clan war details',
      error: error.message
    });
  }
});

// GET /api/clan-wars/:id/bracket - Get tournament bracket data
router.get('/:id/bracket', async (req, res) => {
  try {
    const { id } = req.params;

    const competition = await Competition.findById(id);
    if (!competition || competition.type !== 'CLAN_WAR') {
      return res.status(404).json({
        success: false,
        message: 'Clan war competition not found'
      });
    }

    const fixtures = await Fixture.find({ 
      competitionId: id, 
      isClanWar: true 
    })
      .populate('homeClan', 'name')
      .populate('awayClan', 'name')
      .sort({ round: 1, bracketPosition: 1 });

    // Organize fixtures into bracket structure
    const bracket = organizeIntoBracket(fixtures, competition.numberOfClans);

    res.json({
      success: true,
      data: bracket
    });
  } catch (error) {
    console.error('Error fetching tournament bracket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournament bracket',
      error: error.message
    });
  }
});

// Helper function to generate round names
function generateRoundNames(totalClans) {
  const rounds = [];
  let clansInRound = totalClans;
  
  while (clansInRound > 1) {
    if (clansInRound === 2) {
      rounds.push('Final');
    } else if (clansInRound === 4) {
      rounds.push('Semifinals');
    } else if (clansInRound === 8) {
      rounds.push('Quarterfinals');
    } else if (clansInRound === 16) {
      rounds.push('Round of 16');
    } else if (clansInRound === 32) {
      rounds.push('Round of 32');
    } else {
      rounds.push(`Round of ${clansInRound}`);
    }
    clansInRound = clansInRound / 2;
  }
  
  return rounds;
}

// Helper function to organize fixtures into bracket structure
function organizeIntoBracket(fixtures, totalClans) {
  const roundNames = generateRoundNames(totalClans);
  const bracket = {};

  roundNames.forEach((roundName, index) => {
    const roundFixtures = fixtures.filter(f => f.round === roundName);
    bracket[roundName] = {
      name: roundName,
      matches: roundFixtures.map(fixture => ({
        id: fixture._id,
        homeClan: fixture.homeClan,
        awayClan: fixture.awayClan,
        homeClanPoints: fixture.homeClanPoints,
        awayClanPoints: fixture.awayClanPoints,
        status: fixture.status,
        result: fixture.result,
        individualMatches: fixture.individualMatches,
        bracketPosition: fixture.bracketPosition
      })),
      roundIndex: index
    };
  });

  return bracket;
}

module.exports = router;