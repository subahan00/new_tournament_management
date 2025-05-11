import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
import api from './api'; // adjust the path if it's in a different folder

// Public endpoints
export const getAllCompetitions = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/competitions`);
    return response.data.data; // Access the nested data array
  } catch (error) {
    console.error('Error fetching competitions:', error);
    throw error;
  }
};
export const getCompetition = async (id) => {
  try {
    const response = await api.get(`/competitions/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
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
    const token = localStorage.getItem('authToken');

    if (!token) {
      throw new Error('Unauthorized: No token found');
    }

    const response = await axios.put(
      `${BASE_URL}/api/competitions/${competitionId}`, // Typically RESTful URL (remove /update/)
      competitionData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json' // Explicit content type
        }
      }
    );
    
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Failed to update competition';
    console.error('Error updating competition:', errorMessage);
    
    // Create new error object with proper message
    throw new Error(errorMessage); 
  }
};
const getAllPlayers = async () => {
  try {
    const response = await api.get('/players'); // Adjust endpoint as needed
    return response.data;
  } catch (error) {
    throw error;
  }
};
const competitionService = {
  createCompetition,
  deleteCompetition,
  getAllCompetitions,
  updateCompetition,
  getAllPlayers,
  getCompetition
};


export default competitionService;
