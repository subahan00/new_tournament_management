// server/routes/fixtureRoutes.js

const express = require('express');
const router = express.Router();
const { createFixturesForLeague } = require('../controllers/fixtureController');
const {
  getOngoingCompetitions,
  getCompetitionFixtures,
    updateFixtureResult,
} = require('../controllers/fixtureController');

router.get('/ongoing', getOngoingCompetitions);
router.get('/:competitionId/fixtures', getCompetitionFixtures);
router.post('/create/:competitionId', createFixturesForLeague);
router.patch('/:fixtureId/result', updateFixtureResult);
module.exports = router;
