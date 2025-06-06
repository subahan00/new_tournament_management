// utils/fixtureGenerator.js
const Competition = require('../models/Competition');

// League Type Generation (keep existing implementation)
function generateLeagueFixtures(players, playerNames = new Map()) {
    const fixtures = [];
    const totalPlayers = players.length;

    // Validate input
    if (!Array.isArray(players) || players.length < 2) {
        throw new Error('Invalid players array');
    }

    for (let round = 0; round < 3; round++) {
        for (let i = 0; i < totalPlayers; i++) {
            for (let j = i + 1; j < totalPlayers; j++) {
                const homeId = players[i];
                const awayId = players[j];
                
                fixtures.push({
                    round: `Round ${round + 1}`,
                    homePlayer: round % 2 === 0 ? homeId : awayId,
                    homePlayerName: playerNames.get(
                        (round % 2 === 0 ? homeId : awayId).toString()
                    ) || `Player ${(round % 2 === 0 ? homeId : awayId).toString().slice(-4)}`,
                    awayPlayer: round % 2 === 0 ? awayId : homeId,
                    awayPlayerName: playerNames.get(
                        (round % 2 === 0 ? awayId : homeId).toString()
                    ) || `Player ${(round % 2 === 0 ? awayId : homeId).toString().slice(-4)}`,
                    isNeutralVenue: round === 2
                });
            }
        }
    }
    return fixtures;
}

// Knockout Type Generation (updated organization)
const ROUND_NAMES = {
  2: ['Final'],
  4: ['Semi-Final', 'Final'],
  8: ['Quarter-Final', 'Semi-Final', 'Final'],
  16: ['Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'],
  32: ['Round of 32', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final']
};

const generateKnockoutFixtures = {
  initialize: (competition) => {
    const playerCount = competition.players.length;
    
    if (!ROUND_NAMES[playerCount]) {
      throw new Error('Invalid player count for knockout (must be 2, 4, 8, 16, or 32)');
    }

    const shuffledPlayers = shuffleArray([...competition.players]);
    const roundName = ROUND_NAMES[playerCount][0];
    
    return pairPlayers(shuffledPlayers, competition._id, roundName);
  },

  nextRound: (competition, winners) => {
    const playerCount = competition.players.length;
    const currentRoundIndex = competition.currentRound.index + 1;
    const roundName = ROUND_NAMES[playerCount][currentRoundIndex];

    if (!roundName) throw new Error('Competition has reached its final round');

    const shuffledWinners = shuffleArray(winners);
    return pairPlayers(shuffledWinners, competition._id, roundName);
  }
};

// Shared Helper Functions
// function shuffleArray(array) {
//   return array.sort(() => Math.random() - 0.5);
// }

function pairPlayers(players, competitionId, roundName, playerNames) { // Add playerNames parameter
  return Array.from({ length: Math.ceil(players.length / 2) }, (_, i) => ({
    competitionId,
    round: roundName,
    homePlayer: players[i * 2],
    homePlayerName: playerNames.get(players[i * 2]),
    awayPlayer: players[i * 2 + 1] || null,
    awayPlayerName: players[i * 2 + 1] ? playerNames.get(players[i * 2 + 1]) : 'Bye',
    status: 'pending',
    matchDate: calculateRoundDate(roundName)
  }));
}

function calculateRoundDate(roundName) {
  const roundDates = {
    'Round of 32': 0,
    'Round of 16': 7,
    'Quarter-Final': 14,
    'Semi-Final': 21,
    'Final': 28
  };
  const date = new Date();
  date.setDate(date.getDate() + (roundDates[roundName] || 0));
  return date;
}
/**
 * Utility functions for generating knockout tournament fixtures
 */

/**
 * Get round name based on the number of players and the current round index
 * @param {number} totalPlayers - Total number of players in the competition
 * @param {number} roundIndex - The current round index (0-based)
 * @returns {string} - Name of the round (e.g., "Round of 32", "Quarter Finals")
 */
const getRoundName = (totalPlayers, roundIndex) => {
  const totalRounds = Math.log2(totalPlayers);
  const remainingRounds = totalRounds - roundIndex;
  
  switch (remainingRounds) {
    case 5: return 'Round of 32';
    case 4: return 'Round of 16';
    case 3: return 'Quarter Finals';
    case 2: return 'Semi Finals';
    case 1: return 'Final';
    default: return `Round ${roundIndex + 1}`;
  }
};

/**
 * Calculate the total number of rounds for a knockout tournament
 * @param {number} numberOfPlayers - Number of players in the competition
 * @returns {number} - Total number of rounds
 */
const calculateTotalRounds = (numberOfPlayers) => {
  return Math.ceil(Math.log2(numberOfPlayers));
};

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} - Shuffled array
 */
const shuffleArray = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Generate first round fixtures for a knockout tournament
 * @param {Array} players - Array of player IDs
 * @param {string} competitionId - ID of the competition
 * @param {number} numberOfPlayers - Number of players in the competition
 * @returns {Array} - Array of fixture objects for the first round
 */
const generateFirstRoundFixtures = (players, competitionId, numberOfPlayers, playerNames) => {
  const shuffledPlayers = shuffleArray(players);
  const fixtures = [];
  const numberOfMatches = numberOfPlayers / 2;
  const roundName = getRoundName(numberOfPlayers, 0);

  for (let i = 0; i < numberOfMatches; i++) {
    fixtures.push({
      competitionId,
      round: roundName,
      homePlayer: shuffledPlayers[i * 2],
      homePlayerName: playerNames.get(shuffledPlayers[i * 2]),
      awayPlayer: shuffledPlayers[i * 2 + 1],
      awayPlayerName: playerNames.get(shuffledPlayers[i * 2 + 1]),
      status: 'pending',
      homeScore: null,
      awayScore: null,
      result: null
    });
  }
  
  return fixtures;
};

/**
 * Generate fixtures for the next round based on winners from the current round
 * @param {Array} currentRoundFixtures - Array of fixture objects from the current round
 * @param {string} competitionId - ID of the competition
 * @param {string} currentRound - Current round name
 * @param {number} numberOfPlayers - Initial number of players in the competition
 * @returns {Array} - Array of fixture objects for the next round
 */
const generateNextRoundFixtures = (currentRoundFixtures, competitionId, currentRound, numberOfPlayers,playerNames) => {
  const winners = currentRoundFixtures
    .filter(fixture => fixture.result !== null)
    .map(fixture => {
      return fixture.result === 'home' ? fixture.homePlayer : fixture.awayPlayer;
    });
  
  if (winners.length % 2 !== 0) {
    throw new Error('Cannot generate next round: odd number of winners');
  }
  
  // Determine next round name
  let nextRound;
  switch (currentRound) {
    case 'Round of 32': nextRound = 'Round of 16'; break;
    case 'Round of 16': nextRound = 'Quarter Finals'; break;
    case 'Quarter Finals': nextRound = 'Semi Finals'; break;
    case 'Semi Finals': nextRound = 'Final'; break;
    default: 
      // For custom round names, calculate based on player count
      const totalRounds = calculateTotalRounds(numberOfPlayers);
      const currentRoundIndex = ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5'].indexOf(currentRound);
      if (currentRoundIndex >= 0) {
        nextRound = getRoundName(numberOfPlayers, currentRoundIndex + 1);
      } else {
        nextRound = 'Next Round';
      }
  }
  
  const fixtures = [];
  const numberOfMatches = winners.length / 2;
  
  for (let i = 0; i < numberOfMatches; i++) {
    fixtures.push({
      competitionId,
      round: nextRound,
      homePlayer: winners[i * 2],
      homePlayerName: playerNames.get(winners[i * 2]),
      awayPlayer: winners[i * 2 + 1],
      awayPlayerName: playerNames.get(winners[i * 2 + 1]),
      status: 'pending',
      homeScore: null,
      awayScore: null,
      result: null
    });
  }
  
  return fixtures;
};
// Export all generators and shared constants
module.exports = {
  generateLeagueFixtures,
  generateKnockoutFixtures,
  ROUND_NAMES,
  generateFirstRoundFixtures,
  generateNextRoundFixtures,
  calculateTotalRounds,
  getRoundName,
  shuffleArray,
  pairPlayers // Add this if not already exported
};

