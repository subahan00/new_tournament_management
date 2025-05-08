const mongoose = require('mongoose');

// Your competition schema and model code here


const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });
const Admin = mongoose.model('Admin', adminSchema);
module.exports = mongoose.model('Admin', adminSchema);
