// utils/fixtureGenerator.js
function generateLeagueFixtures(players) {
    const fixtures = [];
    const totalPlayers = players.length;

    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < totalPlayers; i++) {
        for (let j = i + 1; j < totalPlayers; j++) {
          fixtures.push({
            round: `Round ${round + 1}`,
            homePlayer: round % 2 === 0 ? players[i] : players[j],
            awayPlayer: round % 2 === 0 ? players[j] : players[i],
            isNeutralVenue: round === 2
          });
        }
      }
    }

    return fixtures;
}

// 👇 Use either named export (recommended) or default export:

// Option A: Named export (use with { generateLeagueFixtures } import)
module.exports = { generateLeagueFixtures };

// OR Option B: Default export (use with direct require)
// module.exports = generateLeagueFixtures;