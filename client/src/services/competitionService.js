import axios from 'axios';

const API_URL = 'http://localhost:5000/api/competitions'; // Backend API URL

export const createCompetition = async (competitionData) => {
  try {
    const response = await axios.post(API_URL, competitionData);
    return response.data;
  } catch (error) {
    console.error('Error creating competition', error);
    throw error;
  }
};

// Other API functions (fetch competitions, delete, etc.) can be added here
