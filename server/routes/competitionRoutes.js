const express = require('express');
const router = express.Router();
const competitionController = require('../controllers/competitionController');

// Public GET route
router.get('/', competitionController.getAllCompetitions); // For /competitions

// Protected admin routes (to be added later)
router.post('/create', competitionController.createCompetition); // Will be /api/competitions/create
router.delete('/delete/:id', competitionController.deleteCompetition);

module.exports = router;