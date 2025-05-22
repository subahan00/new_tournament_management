import axios from 'axios';
const BASE_URL = 'http://localhost:5000/api';

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
    const response = await axios.get(`${BASE_URL}/competitions/${competitionId}`);
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