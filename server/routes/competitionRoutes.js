const express = require('express');
const router = express.Router();
const competitionController = require('../controllers/competitionController');
const { 
  authenticate,
  validateCompetition,
  apiLimiter,
  sanitizeInput,
  errorHandler
} = require('../utils/middlewares');

// Apply global middlewares
router.use(sanitizeInput);
router.use(apiLimiter);

// Public routes
router.get('/', competitionController.getAllCompetitions);
router.get('/league/upcoming', competitionController.getUpcomingLeagueCompetitions);
router.get('/:id', competitionController.getCompetitionById);

// Protected admin routes
router.post('/create', 
  authenticate,
  validateCompetition,
  competitionController.createCompetition
);

router.put('/:id', 
  authenticate,
  validateCompetition,
  competitionController.updateCompetition
);

router.delete('/delete/:id',
  competitionController.deleteCompetition
);

// Error handler
router.use(errorHandler);

module.exports = router;