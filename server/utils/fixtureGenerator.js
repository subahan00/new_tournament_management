const Competition = require('../models/Competition');
const Clan=require('../models/Clan');
const Fixture = require('../models/Fixture');
// Generate clan war round fixtures
async function generateClanWarRound(competitionId, clanIds, roundName) {
  if (clanIds.length < 2) return;

  // Shuffle clans for random pairing
  const shuffledClans = shuffleArray(clanIds);
  
  // Create fixtures for pairs
  for (let i = 0; i < shuffledClans.length; i += 2) {
    if (i + 1 < shuffledClans.length) {
      const homeClan = await Clan.findById(shuffledClans[i]).populate('members');
      const awayClan = await Clan.findById(shuffledClans[i + 1]).populate('members');

      // Randomly pair up members from each clan
      const shuffledHomeMembers = shuffleArray(homeClan.members);
      const shuffledAwayMembers = shuffleArray(awayClan.members);

      const individualMatches = [];
      for (let j = 0; j < 5; j++) {
        individualMatches.push({
          homePlayer: shuffledHomeMembers[j]._id,
          awayPlayer: shuffledAwayMembers[j]._id,
          homePlayerName: shuffledHomeMembers[j].name,
          awayPlayerName: shuffledAwayMembers[j].name,
          status: 'pending'
        });
      }

      const fixture = new Fixture({
        competitionId,
        round: roundName,
        isClanWar: true,
        homeClan: homeClan._id,
        awayClan: awayClan._id,
        individualMatches,
        homeClanPoints: 0,
        awayClanPoints: 0,
        bracketPosition: Math.floor(i / 2)
      });

      await fixture.save();
    }
  }
}

function generateLeagueFixtures(players, playerNames = new Map(), roundCount = 1) {
    const fixtures = [];
    let n = players.length;

    if (!Array.isArray(players) || players.length < 2) {
        throw new Error('Invalid players array');
    }

    const hasBye = n % 2 !== 0;
    let schedulingPlayers = [...players];
    if (hasBye) {
        schedulingPlayers.push('BYE');
        n += 1; // Ensure n is even
    }

    const matchdaysPerLeg = n - 1;
    const matchesPerMatchday = n / 2;
    let globalMatchday = 1;

    // Generate Base Leg using Berger Tables / Circle Method
    const baseLeg = [];
    let fixed = schedulingPlayers[0];
    let rotating = schedulingPlayers.slice(1);

    for (let md = 0; md < matchdaysPerLeg; md++) {
        const mdPairs = [];

        // Fixed player match (alternate home/away to balance)
        if (md % 2 === 0) {
            mdPairs.push({ home: fixed, away: rotating[0] });
        } else {
            mdPairs.push({ home: rotating[0], away: fixed });
        }

        // Rotating players match (alternate home/away to balance)
        for (let i = 1; i < matchesPerMatchday; i++) {
            let p1 = rotating[i];
            let p2 = rotating[rotating.length - i];
            
            if (i % 2 === 0) {
                mdPairs.push({ home: p1, away: p2 });
            } else {
                mdPairs.push({ home: p2, away: p1 });
            }
        }

        baseLeg.push(mdPairs);
        // Rotate: move last element to the front
        rotating.unshift(rotating.pop());
    }

    // Expand for 'roundCount' legs (repeating the cycle, but shifted and swapped)
    for (let leg = 0; leg < roundCount; leg++) {
        let currentLeg = [...baseLeg];

        // Spread repeated fixtures: shift matchday order for subsequent legs
        const shiftAmount = leg % matchdaysPerLeg;
        if (shiftAmount > 0) {
            currentLeg = [
                ...currentLeg.slice(shiftAmount),
                ...currentLeg.slice(0, shiftAmount)
            ];
        }

        // Alternate home/away for each leg to ensure fairness across multiple rounds
        const swapHomeAway = leg % 2 !== 0;

        for (let mIndex = 0; mIndex < currentLeg.length; mIndex++) {
            const pairs = currentLeg[mIndex];

            for (const pair of pairs) {
                let h = swapHomeAway ? pair.away : pair.home;
                let a = swapHomeAway ? pair.home : pair.away;

                // Ensure BYE is always the 'away' player for consistent data handling
                if (h === 'BYE') {
                    h = a;
                    a = 'BYE';
                }

                const isByeMatch = (a === 'BYE');
                
                // Do not create a fixture object for BYE matches; they are just for scheduling alignment
                if (isByeMatch) {
                    continue;
                }

                const hId = h.toString();
                const aId = a.toString();

                const hName = playerNames.get(hId) || `Player ${hId.slice(-4)}`;
                const aName = playerNames.get(aId) || `Player ${aId.slice(-4)}`;

                fixtures.push({
                    round: `Matchday ${globalMatchday}`,
                    matchday: globalMatchday,
                    homePlayer: h,
                    homePlayerName: hName,
                    awayPlayer: a,
                    awayPlayerName: aName,
                    isNeutralVenue: leg === 2 // Legacy logic: 3rd leg neutral
                });
            }
            globalMatchday++;
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

function pairPlayers(players, competitionId, roundName, playerNames) { // Add playerNames parameter
  return Array.from({ length: Math.ceil(players.length / 2) }, (_, i) => ({
    competitionId,
    round: roundName,
    homePlayer: players[i * 2],
    homePlayerName: playerNames.get(players[i * 2]),
    awayPlayer: players[i * 2 + 1] || null,
    awayPlayerName: players[i * 2 + 1] ? playerNames.get(players[i * 2 + 1]) : 'BYE',
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

/**
 * Assign matchday numbers to fixtures using round-robin (circle method) scheduling.
 * Mutates the fixtures array in-place by setting the `matchday` property.
 * Groups fixtures by round and processes each round independently.
 * 
 * @param {Array} fixtures - Array of fixture objects with homePlayer/awayPlayer as string IDs
 * @returns {Array} - The same array with matchday numbers assigned
 */
function assignMatchdays(fixtures) {
  // Group by round
  const roundMap = new Map();
  fixtures.forEach(f => {
    const r = f.round ?? 'Round 1';
    if (!roundMap.has(r)) roundMap.set(r, []);
    roundMap.get(r).push(f);
  });

  let matchdayOffset = 0;

  for (const [, roundFixtures] of [...roundMap.entries()].sort()) {
    // Collect unique players
    const players = new Set();
    roundFixtures.forEach(f => {
      const homeId = typeof f.homePlayer === 'object' ? f.homePlayer.toString() : f.homePlayer;
      const awayId = typeof f.awayPlayer === 'object' ? f.awayPlayer.toString() : f.awayPlayer;
      players.add(homeId);
      players.add(awayId);
    });

    let playerList = [...players];
    if (playerList.length % 2 === 1) playerList.push(null);

    const totalMDs = playerList.length - 1;
    const half = playerList.length / 2;

    const fixed = playerList[0];
    let rotating = playerList.slice(1);

    for (let md = 0; md < totalMDs; md++) {
      const pairs = [
        [fixed, rotating[0]],
        ...Array.from({ length: half - 1 }, (_, i) => [
          rotating[i + 1],
          rotating[rotating.length - 1 - i]
        ])
      ];

      for (const [a, b] of pairs) {
        if (!a || !b) continue;

        const fixture = roundFixtures.find(f => {
          const hId = typeof f.homePlayer === 'object' ? f.homePlayer.toString() : f.homePlayer;
          const aId = typeof f.awayPlayer === 'object' ? f.awayPlayer.toString() : f.awayPlayer;
          return (hId === a && aId === b) || (hId === b && aId === a);
        });

        if (fixture && fixture.matchday == null) {
          fixture.matchday = matchdayOffset + md + 1;
        }
      }

      rotating.unshift(rotating.pop());
    }

    matchdayOffset += totalMDs;
  }

  return fixtures;
}

module.exports = {
  generateLeagueFixtures,
  generateKnockoutFixtures,
  ROUND_NAMES,
  generateFirstRoundFixtures,
  generateNextRoundFixtures,
  calculateTotalRounds,
  getRoundName,
  shuffleArray,
  pairPlayers,
  generateRoundRobinFixtures,
  generateClanWarRound,
  assignMatchdays
};

