//standingController.js
const Competition = require('../models/Competition');
const Standing = require('../models/Standing');
const { calculateStandings } = require('../utils/standingsCalculator');

exports.getOngoingCompetitions = async (req, res) => {
  try {
    const competitions = await Competition.find({
      
      type: { $in: ['LEAGUE', 'GROUP_STAGE'] }
    }).select('name type startDate players').populate('players', 'name _id').lean();

    res.json({
      success: true,
      data: competitions.map(comp => ({
        _id: comp._id,
        name: comp.name,
        type: comp.type,
        startDate: comp.startDate,
        playerCount: comp.players.length,
        players: comp.players.map(p => ({ _id: p._id, name: p.name }))
      }))
    });
  } catch (err) {
    console.error('Error fetching competitions:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch competitions',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Optimized Backend Controller
exports.getStandings = async (req, res) => {
  try {
    const competitionId = req.params.competitionId;

    // ✅ Fetch name + type
    const competition = await Competition.findById(competitionId)
      .select('name type')
      .lean();

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    // Fetch existing standings
    let standings = await Standing.find({ competition: competitionId })
      .select('-__v')
      .lean();

    // Calculate only if empty
    if (standings.length === 0) {
      await calculateStandings(competitionId);
      standings = await Standing.find({ competition: competitionId })
        .select('-__v')
        .lean();
    }

    // ✅ Single clean response
    res.json({
      success: true,
      competitionId,
      competitionName: competition.name,
      competitionType: competition.type,
      standings
    });

  } catch (err) {
    console.error('Standings error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve standings'
    });
  }
};


// Helper function to format response with proper sorting
function formatStandingsResponse(standings, competitionType) {
  const sortStandings = (a, b) => {
    // Sort by points first
    if (b.points !== a.points) return b.points - a.points;
    
    // Then by goal difference
    const aGD = (a.goalsFor || 0) - (a.goalsAgainst || 0);
    const bGD = (b.goalsFor || 0) - (b.goalsAgainst || 0);
    if (bGD !== aGD) return bGD - aGD;
    
    // Finally by goals scored
    return (b.goalsFor || 0) - (a.goalsFor || 0);
  };

  if (competitionType === 'GROUP_STAGE') {
    // Group by group name and sort each group
    const grouped = standings.reduce((acc, standing) => {
      const group = standing.group || 'Unknown Group';
      if (!acc[group]) acc[group] = [];
      acc[group].push({
        ...standing,
        playerName: standing.playerName || 'Unknown Player',
        playerId: standing.player
      });
      return acc;
    }, {});

    // Sort each group
    Object.keys(grouped).forEach(groupName => {
      grouped[groupName].sort(sortStandings);
    });

    return {
      competitionType: 'GROUP_STAGE',
      groups: grouped,
      standings: grouped
    };
  } else {
    // League format - simple sorted array
    const sorted = standings
      .map(standing => ({
        ...standing,
        playerName: standing.playerName || 'Unknown Player',
        playerId: standing.player
      }))
      .sort(sortStandings);

    return sorted;
  }
}
