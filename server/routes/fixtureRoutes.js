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
  createFixturesForGroupStage,
  getclanWarFixtures,
  getPlayerFixtures,
  revertFixtureResult
} = require('../controllers/fixtureController');

const { authenticate } = require('../utils/middlewares');

// Knockout fixtures
router.post('/generate/knockout/:competitionId', 
  authenticate,
  generateKnockoutFixturesHandler
);

// League fixtures
router.post('/create/:competitionId', 
  authenticate,
  createFixturesForLeague
);

router.post('/create-groupstage/:competitionId', 
  authenticate,
  createFixturesForGroupStage);

// Results management
router.put('/:fixtureId/result', 
  authenticate,
  updateFixtureResult
);
router.get('/ko/competitions', getKnockoutCompetitions);
router.get('/competition-details/:competitionId', getCompetitionById);
router.get('/ko/competition/:competitionId', getFixturesByCompetition);
router.post('/ko/generate/:competitionId', authenticate, generateKoFixtures);
router.put('/ko/:fixtureId/result', authenticate, updateKoFixtureResult);
router.post('/advance-round', authenticate, advanceToNextRound);
router.put('/competition/:competitionId/status', authenticate, updateCompetitionStatus);
router.put('/competition/:competitionId/winner', authenticate, setCompetitionWinner);


// Next round generation
router.post('/:competitionId/next-round',
  authenticate,
  generateNextRoundHandler
);

// Competition fixtures
router.get('/competition/:competitionId', 
  getCompetitionFixtures
);
router.get('/competitions/:competitionId/clan-war-fixtures', getclanWarFixtures);

// Ongoing competitions
router.get('/ongoing', 
  getOngoingCompetitions
);
router.get('/upcoming', 
  getUpcomingCompetitions
);
router.get('/player/:competitionId/:playerId', getPlayerFixtures);
router.put('/:fixtureId/revert', authenticate, revertFixtureResult);

module.exports = router;
