const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const competitionRoutes = require('./routes/competitionRoutes');
const authRoutes = require('./routes/authRoutes');
const playerRoutes = require('./routes/playerRoutes');
const competitionController = require('./controllers/competitionController');
const authController = require('./controllers/authController');
const playerController = require('./controllers/playerController');
const fixtureRoutes = require('./routes/fixtureRoutes');
const fixtureController = require('./controllers/fixtureController');
const { authenticate } = require('./utils/middlewares');  // Import the authenticate middleware
const Competition = require('./models/Competition'); // Import the Competition model
// Initialize Express app
const app = express();
require('dotenv').config();  // Load environment variables from .env file

// Now you can use process.env.JWT_SECRET

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON requests

// Database Connection
mongoose.connect('mongodb://localhost:27017/official90', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});


// Routes
app.use('/competitions', competitionRoutes);


app.use('/api/fixtures', fixtureRoutes);

app.use('/api/competitions', competitionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/competitions', competitionRoutes);
app.use(cors({
  origin: 'http://localhost:3000', // Your React app
  methods: ['GET'] // Only allow GET for public endpoint
}));
// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'API is running',
    message: 'Welcome to the Competitions API',
    available_endpoints: [
      'GET    /api/competitions',
      'POST   /api/competitions',
      'DELETE /api/competitions/:id'
    ]
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Server Configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}/api/competitions`);
});