import axios from 'axios';
const BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;
console.log('Backend URL:', BASE_URL);

export const getAllCompetitions = async () => {
  try { 
    const response = await axios.get(`${BASE_URL}/competitions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching competitions:', error);
    throw error;
  }
};

export const getCompetition = async (competitionId) => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/competitions/${competitionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createCompetition = async (competitionData) => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Unauthorized: No token found');

    const response = await axios.post(
      `${BASE_URL}/competitions/create`,
      competitionData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating competition:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteCompetition = async (competitionId) => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Unauthorized: No token found');

    const response = await axios.delete(
      `${BASE_URL}/competitions/delete/${competitionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting competition:', error);
    throw error;
  }
};
// Replace player in competition
export const replacePlayerInCompetition = async (competitionId, oldPlayerId, newPlayerId) => {
  try {
    const response = await axios.patch(`${BASE_URL}/competitions/${competitionId}/replace-player`, {
      oldPlayerId,
      newPlayerId
    });
    return { success: true, message: response.data.message };
  } catch (error) {
    console.error('Error replacing player in competition:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to replace player',
      error: error.response?.data || error.message 
    };
  }
};
export const updatePlayerNameInCompetition = async (competitionId, playerId, newName) => {
  try {
    const response = await axios.put(`${BASE_URL}/competitions/${competitionId}/player-name`, {
      playerId,
      newName,
    });
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message };
  }
};
// services/competitionService.js
export const updateCompetitionStatus = async (competitionId, newStatus) => {
  try {
    const response = await axios.put(
      `${process.env.REACT_APP_BACKEND_URL}/api/competitions/${competitionId}/status`,
      { status: newStatus },  // Ensure correct payload format
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return { 
      success: true, 
      data: response.data.data,
      message: response.data.message 
    };
    
  } catch (error) {
    console.error('Status update error:', error.response?.data);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update competition status',
      error: error.response?.data
    };
  }
};
export const updateCompetition = async (competitionId, competitionData) => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Unauthorized: No token found');

    const response = await axios.put(
      `${BASE_URL}/competitions/${competitionId}`,
      competitionData,
      { headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }}
    );
    return response.data;
  } catch (error) {
    console.error('Error updating competition:', error.response?.data || error.message);
    throw error;
  }
};
const getAllPlayers = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/players`); // Adjust endpoint as needed
    return response.data;
  } catch (error) {
    throw error;
  }
};
//
export default {
  createCompetition,
  deleteCompetition,
  getAllCompetitions,
  updateCompetition,
  getCompetition,
  getAllPlayers
};
