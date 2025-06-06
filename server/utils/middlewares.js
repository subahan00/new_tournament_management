const jwt = require('jsonwebtoken');
const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const middlewares = {
  // Existing authentication middleware
  authenticate: (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user;
      next();
    } catch (err) {
      const message = err.name === 'TokenExpiredError' 
        ? 'Token expired' 
        : 'Invalid token';
      res.status(401).json({ message });
    }
  },
  
  // Competition validation middleware
  validateCompetition: [
    
    
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ max: 100 }).withMessage('Name must be less than 100 characters'),
    
   
    
    body('players.*')
      .isMongoId().withMessage('Invalid player ID format'),

    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],

  // Error handling middleware
  errorHandler: (err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'ValidationError') {
      return res.status(422).json({
        errors: Object.values(err.errors).map(e => ({
          param: e.path,
          message: e.message
        }))
      });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    res.status(err.statusCode || 500).json({
      message: process.env.NODE_ENV === 'production'
        ? 'Something went wrong'
        : err.message
    });
  },

  // Rate limiting middleware
  apiLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }),

  // Sanitization middleware
  sanitizeInput: (req, res, next) => {
    if (req.body) {
      // Trim whitespace and remove HTML tags
      const sanitize = (value) => {
        if (typeof value === 'string') {
          return value.trim().replace(/<\/?[^>]+(>|$)/g, "");
        }
        return value;
      };

      Object.keys(req.body).forEach(key => {
        req.body[key] = sanitize(req.body[key]);
      });
    }
    next();
  }
};

module.exports = middlewares;