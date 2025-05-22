const express = require('express');
const router = express.Router();
const {
  createFixturesForLeague,
  generateKnockoutFixturesHandler,
  generateNextRoundHandler,
  getOngoingCompetitions,
  getCompetitionFixtures,
  updateFixtureResult,
  getUpcomingCompetitions,
  getKnockoutCompetitions,
  getCompetitionById, 
  generateKoFixtures,
  updateKoFixtureResult,
  advanceToNextRound,
  updateCompetitionStatus,
  setCompetitionWinner,
  getFixturesByCompetition,
} = require('../controllers/fixtureController');

const { authenticate } = require('../utils/middlewares');

// Knockout fixtures
router.post('/generate/knockout/:competitionId', 
  authenticate,
  generateKnockoutFixturesHandler
);

// League fixtures
router.post('/create/:competitionId', 
 
  createFixturesForLeague
);

// Results management
router.put('/:fixtureId/result', 
  
  updateFixtureResult
);
router.get('/ko/competitions', getKnockoutCompetitions);
router.get('/ko/competition-details/:competitionId', getCompetitionById);
router.get('/ko/competition/:competitionId', getFixturesByCompetition);
router.post('/ko/generate/:competitionId', generateKoFixtures);
router.put('/ko/:fixtureId/result', updateKoFixtureResult);
router.post('/advance-round', advanceToNextRound);
router.put('/competition/:competitionId/status', updateCompetitionStatus);
router.put('/competition/:competitionId/winner', setCompetitionWinner);


// Next round generation
router.post('/:competitionId/next-round',
  authenticate,
  generateNextRoundHandler
);

// Competition fixtures
router.get('/competition/:competitionId', 
  getCompetitionFixtures
);

// Ongoing competitions
router.get('/ongoing', 
  getOngoingCompetitions
);
router.get('/upcoming', 
  getUpcomingCompetitions
);
module.exports = router;