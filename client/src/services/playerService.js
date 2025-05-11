import api from './api';

const playerService = {
  // Get all players
  getAllPlayers: async () => {
    return await api.get('/players');
  },

  // Create a new player
  createPlayer: async (playerData) => {
    return await api.post('/players', playerData);
  },

  // Delete a player by ID
  deletePlayer: async (playerId) => {
    return await api.delete(`/players/${playerId}`);
  }
};
export const createPlayer = async (playerData) => {
  const response = await api.post('/players', playerData);
  return response.data;
};
export default playerService;
