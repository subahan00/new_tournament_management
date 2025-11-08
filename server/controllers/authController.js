const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const loginAdmin = async (req, res) => {
  const { username, password, rememberMe } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ message: 'Admin not found' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const user = {
      id: admin._id,
      username: admin.username,
      role: 'admin'
    };

    // Set token expiration based on rememberMe
    // Remember Me: 30 days, Regular: 4 hours
    const expiresIn = rememberMe ? '30d' : '4h';
    
    const token = jwt.sign(
      { user }, 
      process.env.JWT_SECRET,
      { expiresIn }
    );

    // Log for debugging (remove in production)
    console.log(`Admin ${username} logged in. Remember Me: ${rememberMe}. Token expires in: ${expiresIn}`);
    
    res.status(200).json({ 
      token, 
      user,
      expiresIn // Optional: send this to frontend for display purposes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { loginAdmin };