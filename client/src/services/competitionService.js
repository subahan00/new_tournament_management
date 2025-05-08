import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Public endpoints
export const getAllCompetitions = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/competitions`);
    return response.data.data; // Access the nested data array
  } catch (error) {
    console.error('Error fetching competitions:', error);
    throw error;
  }
};

// Admin endpoints (protected - will add auth later)
export const createCompetition = async (competitionData) => {
  try {
    const token = localStorage.getItem('authToken'); // Assuming token is stored in localStorage after login

    // If token is not available, throw an error
    if (!token) {
      throw new Error('Unauthorized: No token found');
    }

    const response = await axios.post(
      `${BASE_URL}/api/competitions/create`,
      competitionData,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in the Authorization header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating competition:', error.response?.data || error.message);
    throw error;
  }
};

// Admin endpoint to delete competition (protected)
export const deleteCompetition = async (competitionId) => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Unauthorized: No token found');
    }

    const response = await axios.delete(
      `${BASE_URL}/api/competitions/delete/${competitionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    // Return a consistent success object
    return {
      success: true,
      data: response.data,
      message: response.data?.message || 'Competition deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting competition:', error);
    // Return a consistent error object
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      error: error
    };
  }
};

// Admin endpoint to update competition (protected)
export const updateCompetition = async (competitionId, competitionData) => {
  try {
    const token = localStorage.getItem('authToken'); // Get the token

    if (!token) {
      throw new Error('Unauthorized: No token found');
    }

    const response = await axios.put(
      `${BASE_URL}/api/competitions/update/${competitionId}`,
      competitionData,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in the Authorization header
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating competition:', error.response?.data || error.message);
    throw error;
  }
};

const competitionService = {
  createCompetition,
  deleteCompetition,
  getAllCompetitions,
  updateCompetition,
};

export default competitionService;
