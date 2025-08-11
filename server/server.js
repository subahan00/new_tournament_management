const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const http = require('http');
const { Server } = require('socket.io');
const Competition = require('./models/Competition');
const standings = require('./models/Standing');
const Announcement = require('./models/Announcement');
const competitionRoutes = require('./routes/competitionRoutes');
const authRoutes = require('./routes/authRoutes');
const playerRoutes = require('./routes/playerRoutes');
const fixtureRoutes = require('./routes/fixtureRoutes');
const standingRoutes = require('./routes/standingRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const Admin = require('./models/Admin');
const winnerRoutes = require('./routes/resultRoutes');
const app = express();
const server = http.createServer(app);
const bcrypt = require('bcryptjs');
const Applicant=require('./models/Application');
const wallpaperRoutes = require('./routes/wallpaperRoutes');
const Auction = require('./models/Auction');
const AuctionPlayer = require('./models/AuctionPlayer');
const Bidder = require('./models/Bidder');
const Bid = require('./models/Bid');
const ChatMessage = require('./models/ChatMessage');
const plainPassword = 'Pratham@3623';
const auctionRoutes = require('./routes/auctionRoutes');
const auctionHandler = require('./socketHandlers/auctionHandler');
// Hash the passwor
bcrypt.genSalt(10, (err, salt) => {
  if (err) throw err;

  bcrypt.hash(plainPassword, salt, (err, hash) => {
    if (err) throw err;

    console.log('🔐 Encrypted password:', hash);
  });
});

// ✅ Allow both localhost and deployed frontend
const allowedOrigins = [
  'http://localhost:3000',
  'https://official90.onrender.com',
  'https://official90-eta.vercel.app',
  'https://official90.vercel.app'
];

// ✅ Updated Middleware for CORS
app.set('trust proxy', true);
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// ✅ Updated Socket.IO config for CORS
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS (Socket.IO)'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});


io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ API Routes
app.use('/api/competitions', competitionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/fixtures', fixtureRoutes);
app.use('/api/standings', standingRoutes);
app.use('/api/winners', winnerRoutes);
app.use('/api/wallpaper', wallpaperRoutes);
app.use('/api/announcements', announcementRoutes);

app.use('/api/auctions', auctionRoutes);
auctionHandler(io);

// ✅ Password Reset Route
app.post('/api/auth/reset-password', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  try {
    const user = await Admin.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});
app.post('/submit', async (req, res) => {
  try {
    const newApplicant = new Applicant(req.body);
    await newApplicant.save();
    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/admin/applicants', async (req, res) => {
  try {
    const applicants = await Applicant.find().sort({ createdAt: -1 });
    res.json(applicants);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
app.delete('/admin/applicants/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Applicant.findByIdAndDelete(id);
    res.status(200).json({ message: 'Applicant deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
// ✅ Serve Frontend
app.use(express.static(path.join(__dirname, '../client/build')));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});
// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
  }
  res.status(500).json({ message: error.message });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
