const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin'); // Assuming you have an Admin model defined

// Admin login function
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ message: 'Admin not found' });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { user: { id: admin._id, username: admin.username } },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // You can adjust the token expiry as needed
    );

    res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { loginAdmin };
