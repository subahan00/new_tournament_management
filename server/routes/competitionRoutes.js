const express = require('express');
const router = express.Router();
const competitionController = require('../controllers/competitionController');
const { authenticate } = require('../utils/middlewares');  // Import the authenticate middleware
const Competition = require('../models/Competition'); // Import the Competition model
// Public GET route (for fetching competitions)
router.get('/', competitionController.getAllCompetitions); // For /competitions

// Protected admin routes (to be accessed by authenticated admins only)
router.post('/create', authenticate, competitionController.createCompetition); // For /api/competitions/create
router.delete('/delete/:id', authenticate, competitionController.deleteCompetition); // For /api/competitions/delete/:id
router.get('/league/upcoming', async (req, res) => {
    try {
      const competitions = await Competition.find({
        type: 'LEAGUE', // lowercase to match DB
        status: 'upcoming',
      });
      res.json(competitions);
    } catch (err) {
      console.error('Error fetching upcoming league competitions:', err.message);
      res.status(500).json({ error: err.message });
    }
  });
  
module.exports = router;
