const mongoose = require('mongoose');


const applicantSchema = new mongoose.Schema({
  fullName: String,
  whatsapp: String,
  club: String,
  age: Number,
  location: String,
  playingSince: String,
  createdAt: { type: Date, default: Date.now }
});

const Applicant = mongoose.model('Applicant', applicantSchema);
module.exports = Applicant;
