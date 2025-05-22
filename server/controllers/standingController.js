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
    
    // 1. Verify competition exists with players
    const competition = await Competition.findById(competitionId)
      .select('players')
      .populate('players', 'name');
      
    if (!competition) throw new Error('Competition not found');
    if (!competition.players?.length) throw new Error('No players in competition');

    // 2. Calculate and get fresh standings
    await calculateStandings(competitionId);
    
    // 3. Fetch standings with player data
    const standings = await Standing.find({ competition: competitionId })
      .populate({
        path: 'player',
        select: 'name',
        model: 'Player'
      })
      .sort({ points: -1, goalsFor: -1 })
      .lean();

    // 4. Validate and format response
    const validatedStandings = standings.map(standing => ({
      ...standing,
      player: {
        name: standing.player?.name || 'Deleted Player',
        _id: standing.player?._id || null
      }
    }));

    res.json(validatedStandings);

  } catch (err) {
    console.error('Standings error:', err);
    res.status(500).json([]);
  }
};