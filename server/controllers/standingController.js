// standingController.js - OPTIMIZED VERSION

const Competition = require('../models/Competition');
const Standing = require('../models/Standing');
const { calculateStandings, getAllGroupStandings } = require('../utils/standingsCalculator');

// Add simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

exports.getOngoingCompetitions = async (req, res) => {
  try {
    const cacheKey = 'ongoing_competitions';
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    const competitions = await Competition.find({ 
      status: 'ongoing', 
      type: { $in: ['LEAGUE', 'GROUP_STAGE'] } 
    })
    .select('name type startDate players')
    .populate('players', 'name _id')
    .lean();

    const response = {
      success: true,
      data: competitions.map(comp => ({
        _id: comp._id,
        name: comp.name,
        type: comp.type,
        startDate: comp.startDate,
        playerCount: comp.players.length,
        players: comp.players.map(p => ({ _id: p._id, name: p.name }))
      }))
    };

    // Cache the result
    cache.set(cacheKey, { data: response, timestamp: Date.now() });
    res.json(response);

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
    
    // Check cache first
    const cacheKey = `standings_${competitionId}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json(cached.data);
    }

    console.time(`StandingsRequest_${competitionId}`);

    // Single query to get competition info
    const competition = await Competition.findById(competitionId)
      .select('type name')
      .lean();
      
    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    let result;

    if (competition.type === 'GROUP_STAGE') {
      // For group stage, use optimized group standings function
      result = await getAllGroupStandings(competitionId);
    } else {
      // For league, calculate and fetch
      await calculateStandings(competitionId);
      
      const standings = await Standing.find({ competition: competitionId })
        .select('-__v -_id')
        .sort({ points: -1, goalsFor: -1 })
        .lean();

      result = {
        competitionName: competition.name,
        competitionType: competition.type,
        standings: standings.map(standing => ({
          ...standing,
          playerName: standing.playerName || 'Unknown Player',
          playerId: standing.player
        }))
      };
    }

    console.timeEnd(`StandingsRequest_${competitionId}`);

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    res.json(result);

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

// Clear cache when standings are updated (call this from your match result endpoints)
exports.clearStandingsCache = (competitionId) => {
  cache.delete(`standings_${competitionId}`);
  cache.delete('ongoing_competitions');
};

module.exports = exports;
