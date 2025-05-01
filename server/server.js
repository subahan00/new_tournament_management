const express = require('express');
const app = express();
const mongoose = require('mongoose');
const competitionRoutes = require('./routes/competitionRoutes');  

// Middleware to parse JSON requests
app.use(express.json());

// Add the competition routes
app.use('/api/competitions', competitionRoutes);
app.use('/api/create',create)

// MongoDB connection (if not already done in a separate file)
mongoose.connect('mongodb://localhost:27017/official90', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
