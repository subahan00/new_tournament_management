const express = require('express');
const router = express.Router();
const { getOngoingCompetitions, getStandings } = require('../controllers/standingController');

router.get('/ongoing', getOngoingCompetitions);
router.get('/:competitionId', getStandings);

module.exports = router;    