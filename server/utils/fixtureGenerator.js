const Competition = require('../models/Competition');

function generateLeagueFixtures(players, playerNames = new Map(),roundCount ) {
    const fixtures = [];
    const totalPlayers = players.length;

    if (!Array.isArray(players) || players.length < 2) {
        throw new Error('Invalid players array');
    }

    for (let round = 0; round < roundCount; round++) {
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

const ROUND_NAMES = {
  2: ['Final'],
  4: ['Semi-Final', 'Final'],
  8: ['Quarter-Final', 'Semi-Final', 'Final'],
  16: ['Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'],
  32: ['Round of 32', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'],
  64: ['Round of 64', 'Round of 32', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final']
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
    'Round of 64': -21,
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
    case 6: return 'Round of 64';
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
      result: null,
      // Add bracket metadata
      bracketPosition: i,  // Each match gets a unique position
      previousMatches: []  // No previous matches
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
const generateNextRoundFixtures = (currentRoundFixtures, competitionId, currentRound, numberOfPlayers, playerNames) => {
  // Sort by bracket position to maintain order
  const sortedFixtures = [...currentRoundFixtures].sort(
    (a, b) => a.bracketPosition - b.bracketPosition
  );

  // Track winners with their bracket metadata
  const winners = [];
  for (const fixture of sortedFixtures) {
    if (fixture.result === 'home') {
      winners.push({
        playerId: fixture.homePlayer,
        bracketPosition: fixture.bracketPosition,
        sourceFixture: fixture._id
      });
    } else if (fixture.result === 'away') {
      winners.push({
        playerId: fixture.awayPlayer,
        bracketPosition: fixture.bracketPosition,
        sourceFixture: fixture._id
      });
    }
  }

  // Error if odd number of winners
  if (winners.length % 2 !== 0) {
    throw new Error(`Odd number of winners (${winners.length}) in ${currentRound}`);
  }

  // Determine next round name
  const roundProgression = {
    'Round of 64': 'Round of 32',
    'Round of 32': 'Round of 16',
    'Round of 16': 'Quarter Finals',
    'Quarter Finals': 'Semi Finals',
    'Semi Finals': 'Final'
  };
  
  let nextRound = roundProgression[currentRound] || 'Next Round';

  // Group winners by bracket section
  const bracketGroups = new Map();
  winners.forEach(winner => {
    const groupKey = Math.floor(winner.bracketPosition / 2);
    if (!bracketGroups.has(groupKey)) {
      bracketGroups.set(groupKey, []);
    }
    bracketGroups.get(groupKey).push(winner);
  });

  // Generate next round fixtures
  const nextFixtures = [];
  let nextPosition = 0;
  
  // Process groups in order
  const sortedGroups = [...bracketGroups.keys()].sort((a, b) => a - b);
  for (const groupKey of sortedGroups) {
    const groupWinners = bracketGroups.get(groupKey);
    
    // Sort by original bracket position
    groupWinners.sort((a, b) => a.bracketPosition - b.bracketPosition);
    
    // Create matches within group
    for (let i = 0; i < groupWinners.length; i += 2) {
      if (i + 1 < groupWinners.length) {
        const p1 = groupWinners[i];
        const p2 = groupWinners[i + 1];
        
        nextFixtures.push({
          competitionId,
          round: nextRound,
          homePlayer: p1.playerId,
          homePlayerName: playerNames.get(p1.playerId),
          awayPlayer: p2.playerId,
          awayPlayerName: playerNames.get(p2.playerId),
          status: 'pending',
          result: null,
          bracketPosition: nextPosition++,
          previousMatches: [p1.sourceFixture, p2.sourceFixture]
        });
      }
    }
  }

  return nextFixtures;
};
const generateRoundRobinFixtures=(players, competitionId, groupName)=> {
    const fixtures = [];
    
    // Generate all possible pairings (round-robin)
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const homePlayer = players[i];
        const awayPlayer = players[j];
        
        fixtures.push({
          competitionId,
          round: groupName,
          homePlayer: homePlayer._id,
          homePlayerName: homePlayer.name,
          awayPlayer: awayPlayer._id,
          awayPlayerName: awayPlayer.name,
          matchDate: new Date(),
          status: 'pending'
        });
      }
    }
    
    return fixtures;
  };
module.exports = {
  generateLeagueFixtures,
  generateKnockoutFixtures,
  ROUND_NAMES,
  generateFirstRoundFixtures,
  generateNextRoundFixtures,
  calculateTotalRounds,
  getRoundName,
  shuffleArray,
  pairPlayers ,
  generateRoundRobinFixtures
};

