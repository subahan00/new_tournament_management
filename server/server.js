const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const http = require('http');
const { Server } = require('socket.io');
const Competition = require('./models/Competition'); // Import the Competition model
const standings = require('./models/Standing'); // Import the Standing model
// Import Routes
const competitionRoutes = require('./routes/competitionRoutes');
const authRoutes = require('./routes/authRoutes');
const playerRoutes = require('./routes/playerRoutes');
const fixtureRoutes = require('./routes/fixtureRoutes');
const standingRoutes = require('./routes/standingRoutes');
const Admin = require('./models/Admin'); // Import the Admin model
const app = express();
const server = http.createServer(app);
const bcrypt = require('bcryptjs');
const resultRoutes = require('./routes/resultRoutes');

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ******************************************************************
// IMPORTANT: Move express.json() here, before any routes that use it
app.use(express.json());
// ******************************************************************

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// API Routes
app.use('/api/competitions', competitionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/fixtures', fixtureRoutes);
app.use('/api/standings', standingRoutes);
app.use('/api/result', resultRoutes);

// Health Che
app.get('/', (req, res) => {
  res.status(200).json({ status: 'API is running' });
});

// Add this new route for password reset
app.post('/api/auth/reset-password', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  try {
    // 1. Find the user by username
    const user = await Admin.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Update the password
    user.password = hashedPassword;
    await user.save();

    // 5. Return success response
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// ******************************************************************
// Serve static assets in production - these should come AFTER API routes
// but BEFORE the catch-all handler

app.use(express.static(path.join(__dirname, '../client/build')));

// FIXED: Catch-all handler for React Router (replaces the problematic '*' route)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// ******************************************************************

// 404 Handler for API routes only


// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Start the Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});