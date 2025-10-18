// routes/clanRoutes.js
const express = require('express');
const router = express.Router();
const clanController = require('../controllers/clanController');

// Get all clans
router.get('/', clanController.getAllClans);

// Get clans by competition
router.get('/competition/:competitionId', clanController.getClansByCompetition);

// Get single clan with populated members
router.get('/:id', clanController.getClanById);

// Create new clan
router.post('/', clanController.createClan);

// Update clan
router.put('/:id', clanController.updateClan);

// Delete clan
router.delete('/:id', clanController.deleteClan);

module.exports = router;