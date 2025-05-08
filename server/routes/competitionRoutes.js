const express = require('express');
const router = express.Router();
const competitionController = require('../controllers/competitionController');
const { authenticate } = require('../utils/middlewares');  // Import the authenticate middleware

// Public GET route (for fetching competitions)
router.get('/', competitionController.getAllCompetitions); // For /competitions

// Protected admin routes (to be accessed by authenticated admins only)
router.post('/create', authenticate, competitionController.createCompetition); // For /api/competitions/create
router.delete('/delete/:id', authenticate, competitionController.deleteCompetition); // For /api/competitions/delete/:id

module.exports = router;
