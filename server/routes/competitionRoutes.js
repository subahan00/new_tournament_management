const express = require('express');
const router = express.Router();
const competitionController = require('../controllers/competitionController');

// Route for creating a new competition
router.post('/create', competitionController.createCompetition);

// Route for deleting a competition by ID
router.delete('/delete/:id', competitionController.deleteCompetition);

module.exports = router;
2