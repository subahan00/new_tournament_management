const Competition = require('../models/Competition');
const Standing = require('../models/Standing');
const { calculateStandings } = require('../utils/standingsCalculator');


exports.getOngoingCompetitions = async (req, res) => {
  try {
    const competitions = await Competition.find({ status: 'ongoing', type: 'LEAGUE' })
      .select('name type startDate players')
      .populate('players', 'name _id')
      .lean();

    // Standardized response format
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

exports.getStandings = async (req, res) => {
  try {
    const competitionId = req.params.competitionId;

    // 1. Verify competition exists
    const competition = await Competition.findById(competitionId);
    if (!competition) throw new Error('Competition not found');

    // 2. Calculate standings using competition-specific data
    await calculateStandings(competitionId);

    // 3. Fetch standings with LOCAL player names (don't populate from Player model)
    const standings = await Standing.find({ competition: competitionId })
      .select('-__v -_id') // Exclude unnecessary fields
      .sort({ points: -1, goalsFor: -1 })
      .lean();

    // 4. Format response using competition-specific names
    const formattedStandings = standings.map(standing => ({
      ...standing,
      playerName: standing.playerName || 'Unknown Player', // Use stored competition name
      playerId: standing.player // Keep reference if needed
    }));

    res.json(formattedStandings);

  } catch (err) {
    console.error('Standings error:', err);
    res.status(500).json({
      success: false,
      message: err.message.includes('Competition') 
        ? err.message 
        : 'Failed to retrieve standings'
    });
  }
};