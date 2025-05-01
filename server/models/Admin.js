const mongoose = require('mongoose');

// Your competition schema and model code here


const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
