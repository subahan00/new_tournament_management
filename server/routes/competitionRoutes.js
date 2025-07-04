const express = require('express');
const router = express.Router();
const Competition = require('../models/Competition');
const Fixture = require('../models/Fixture');
const competitionController = require('../controllers/competitionController');
const { 
  authenticate,
  validateCompetition,
  apiLimiter,
  sanitizeInput,
  errorHandler
} = require('../utils/middlewares');

// Apply global middlewar

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
router.put('/:competitionId/player-name', competitionController.updatePlayerNameInCompetition);

router.put('/:id', 
  authenticate,
  validateCompetition,
  competitionController.updateCompetition
);
// Backend route
// competitions.js (backend route)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['upcoming', 'ongoing', 'completed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Allowed values: upcoming, ongoing, completed' 
      });
    }

    const competition = await Competition.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // If status changed to completed, handle related data
    if (status === 'completed') {
      await Fixture.deleteMany({ competitionId: competition._id });
    }

    res.json({
      success: true,
      data: competition,
      message: `Status updated to ${status}`
    });
    
  } catch (error) {
    console.error('Status update error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Status update failed'
    });
  }
});
router.delete('/delete/:id',
  competitionController.deleteCompetition
);
router.patch('/:id/replace-player', competitionController.replacePlayerInCompetition);
// Error handler
router.use(errorHandler);

module.exports = router;    
