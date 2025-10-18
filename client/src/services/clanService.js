// services/clanService.js
import axios from './api';

const clanService = {
  // Get all clans
  getAllClans: async () => {
    try {
      const response = await axios.get('/clans');
      return response.data;
    } catch (error) {
      console.error('Error fetching clans:', error);
      throw error;
    }
  },

  // Get clans by competition
  getClansByCompetition: async (competitionId) => {
    try {
      const response = await axios.get(`/clans/competition/${competitionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching clans by competition:', error);
      throw error;
    }
  },

  // Get single clan
  getClanById: async (clanId) => {
    try {
      const response = await axios.get(`/clans/${clanId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching clan:', error);
      throw error;
    }
  },

  // Create new clan
  createClan: async (clanData) => {
    try {
      const response = await axios.post('/clans', clanData);
      return response.data;
    } catch (error) {
      console.error('Error creating clan:', error);
      throw error;
    }
  },

  // Update clan
  updateClan: async (clanId, clanData) => {
    try {
      const response = await axios.put(`/clans/${clanId}`, clanData);
      return response.data;
    } catch (error) {
      console.error('Error updating clan:', error);
      throw error;
    }
  },

  // Delete clan
  deleteClan: async (clanId) => {
    try {
      const response = await axios.delete(`/clans/${clanId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting clan:', error);
      throw error;
    }
  }
};

export default clanService;