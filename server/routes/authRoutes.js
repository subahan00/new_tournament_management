const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST route for admin login
router.post('/login', authController.loginAdmin);

module.exports = router;
