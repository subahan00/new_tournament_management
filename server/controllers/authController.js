const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ message: 'Admin not found' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Create user object to send to frontend
    const user = {
      id: admin._id,
      username: admin.username,
      role: 'admin'// Make sure your Admin model has a role field
    };

    // Generate JWT token with user data
    const token = jwt.sign(
      { user }, // Include user data in the token
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    // Return both token and user data
    res.status(200).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { loginAdmin };