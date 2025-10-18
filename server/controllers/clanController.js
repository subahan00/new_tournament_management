// controllers/clanController.js
const Clan = require('../models/Clan');
const Player = require('../models/Player');
const Competition = require('../models/Competition');

// Get all clans with populated members
exports.getAllClans = async (req, res) => {
  try {
    const clans = await Clan.find()
      .populate('members', 'name')
      .populate('competitionId', 'name')
      .sort({ createdAt: -1 });
    
    res.status(200).json(clans);
  } catch (error) {
    console.error('Error fetching clans:', error);
    res.status(500).json({ message: 'Error fetching clans', error: error.message });
  }
};

// Get clans by competition
exports.getClansByCompetition = async (req, res) => {
  try {
    const { competitionId } = req.params;
    const clans = await Clan.find({ competitionId })
      .populate('members', 'name')
      .sort({ points: -1 });
    
    res.status(200).json(clans);
  } catch (error) {
    console.error('Error fetching clans by competition:', error);
    res.status(500).json({ message: 'Error fetching clans', error: error.message });
  }
};

// Get single clan by ID
exports.getClanById = async (req, res) => {
  try {
    const clan = await Clan.findById(req.params.id)
      .populate('members', 'name')
      .populate('competitionId', 'name');
    
    if (!clan) {
      return res.status(404).json({ message: 'Clan not found' });
    }
    
    res.status(200).json(clan);
  } catch (error) {
    console.error('Error fetching clan:', error);
    res.status(500).json({ message: 'Error fetching clan', error: error.message });
  }
};

// Create new clan
exports.createClan = async (req, res) => {
  try {
    const { name, competitionId, members } = req.body;

    // Validate members count
    if (!members || members.length !== 5) {
      return res.status(400).json({ message: 'Each clan must have exactly 5 members' });
    }

    // Check if competition exists
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // Verify all members exist
    const memberPlayers = await Player.find({ _id: { $in: members } });
    if (memberPlayers.length !== 5) {
      return res.status(400).json({ message: 'One or more member IDs are invalid' });
    }

    // Check if clan name already exists in this competition
    const existingClan = await Clan.findOne({ name, competitionId });
    if (existingClan) {
      return res.status(400).json({ message: 'A clan with this name already exists in this competition' });
    }

    const newClan = new Clan({
      name,
      competitionId,
      members
    });

    await newClan.save();
    
    const populatedClan = await Clan.findById(newClan._id)
      .populate('members', 'name')
      .populate('competitionId', 'name');

    res.status(201).json(populatedClan);
  } catch (error) {
    console.error('Error creating clan:', error);
    res.status(500).json({ message: 'Error creating clan', error: error.message });
  }
};

// Update clan
exports.updateClan = async (req, res) => {
  try {
    const { name, members } = req.body;

    // Validate members count if provided
    if (members && members.length !== 5) {
      return res.status(400).json({ message: 'Each clan must have exactly 5 members' });
    }

    const clan = await Clan.findById(req.params.id);
    if (!clan) {
      return res.status(404).json({ message: 'Clan not found' });
    }

    if (name) clan.name = name;
    if (members) clan.members = members;

    await clan.save();

    const updatedClan = await Clan.findById(clan._id)
      .populate('members', 'name')
      .populate('competitionId', 'name');

    res.status(200).json(updatedClan);
  } catch (error) {
    console.error('Error updating clan:', error);
    res.status(500).json({ message: 'Error updating clan', error: error.message });
  }
};

// Delete clan
exports.deleteClan = async (req, res) => {
  try {
    const clan = await Clan.findByIdAndDelete(req.params.id);
    
    if (!clan) {
      return res.status(404).json({ message: 'Clan not found' });
    }

    res.status(200).json({ message: 'Clan deleted successfully', success: true });
  } catch (error) {
    console.error('Error deleting clan:', error);
    res.status(500).json({ message: 'Error deleting clan', error: error.message });
  }
};
// controllers/clanController.js
// Update the createClan method to handle the placeholder competition ID

exports.createClan = async (req, res) => {
  try {
    const { name, competitionId, members } = req.body;

    // Validate members count
    if (!members || members.length !== 5) {
      return res.status(400).json({ message: 'Each clan must have exactly 5 members' });
    }

    // If competitionId is the placeholder, don't validate it
    const isPlaceholder = competitionId === '000000000000000000000000';
    
    if (!isPlaceholder) {
      // Check if competition exists
      const competition = await Competition.findById(competitionId);
      if (!competition) {
        return res.status(404).json({ message: 'Competition not found' });
      }
    }

    // Verify all members exist
    const memberPlayers = await Player.find({ _id: { $in: members } });
    if (memberPlayers.length !== 5) {
      return res.status(400).json({ message: 'One or more member IDs are invalid' });
    }

    // Check if clan name already exists
    const existingClan = await Clan.findOne({ name: name.trim() });
    if (existingClan) {
      return res.status(400).json({ message: 'A clan with this name already exists' });
    }

    const newClan = new Clan({
      name: name.trim(),
      competitionId: isPlaceholder ? null : competitionId,
      members
    });

    await newClan.save();
    
    const populatedClan = await Clan.findById(newClan._id)
      .populate('members', 'name')
      .populate('competitionId', 'name');

    res.status(201).json(populatedClan);
  } catch (error) {
    console.error('Error creating clan:', error);
    res.status(500).json({ message: 'Error creating clan', error: error.message });
  }
};