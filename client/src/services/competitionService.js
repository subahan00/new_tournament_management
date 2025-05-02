import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Public endpoints
export const getAllCompetitions = async () => {
  try {
    const response = await axios.get('http://localhost:5000/competitions');
    return response.data.data; // Access the nested data array
  } catch (error) {
    console.error('Error fetching competitions:', error);
    throw error;
  }
};

// Admin endpoints (protected - will add auth later)
export const createCompetition = async (competitionData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/competitions/create`, competitionData);
    return response.data;
  } catch (error) {
    console.error('Error creating competition:', error.response?.data || error.message);
    throw error;
  }
};