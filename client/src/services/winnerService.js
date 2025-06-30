import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api/winners`;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    
    // Handle network errors
    if (!error.response) {
      throw new Error('Network error - please check your connection');
    }
    
    // Handle API errors
    const message = error.response.data?.error || 'An unexpected error occurred';
    const customError = new Error(message);
    customError.status = error.response.status;
    customError.details = error.response.data?.details;
    
    throw customError;
  }
);

// GET /api/winners - Get all players
export const getWinners = async () => {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error) {
    console.error('Error fetching winners:', error.message);
    throw error;
  }
};

// GET /api/winners/:id - Get one player
export const getWinnerById = async (id) => {
  try {
    if (!id) {
      throw new Error('Winner ID is required');
    }
    
    const response = await api.get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching winner ${id}:`, error.message);
    throw error;
  }
};

// POST /api/winners - Create a player with trophies
export const createWinner = async (data) => {
  try {
    if (!data.name || !data.name.trim()) {
      throw new Error('Player name is required');
    }
    
    const response = await api.post('/', {
      name: data.name.trim(),
      trophies: data.trophies || []
    });
    return response.data;
  } catch (error) {
    console.error('Error creating winner:', error.message);
    throw error;
  }
};

// POST /api/winners/:id/trophies - Add trophy to a player
export const addTrophy = async (winnerId, trophy) => {
  try {
    if (!winnerId) {
      throw new Error('Winner ID is required');
    }
    
    if (!trophy.competition || !trophy.competition.trim()) {
      throw new Error('Competition name is required');
    }
    
    const response = await api.post(`/${winnerId}/trophies`, {
      competition: trophy.competition.trim(),
      timesWon: parseInt(trophy.timesWon) || 1
    });
    return response.data;
  } catch (error) {
    console.error(`Error adding trophy to winner ${winnerId}:`, error.message);
    throw error;
  }
};

// PUT /api/winners/:id/trophies - Update trophy count
export const updateTrophy = async (winnerId, trophy) => {
  try {
    console.log("✅ updateTrophy from winnerService.js is running");

    if (!winnerId) {
      throw new Error('Winner ID is required');
    }
    
    if (!trophy.competition || !trophy.competition.trim()) {
      throw new Error('Competition name is required');
    }
    
    if (!trophy.timesWon || parseInt(trophy.timesWon) < 1) {
      throw new Error('Times won must be at least 1');
    }
    
    const response = await api.put(`/${winnerId}/trophies`, {
      competition: trophy.competition,           // old name
      newCompetition: trophy.newCompetition,     // new name
      timesWon: parseInt(trophy.timesWon)
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating trophy for winner ${winnerId}:`, error.message);
    throw error;
  }
};

// DELETE /api/winners/:id/trophies - Remove a specific trophy
export const deleteTrophy = async (winnerId, trophy) => {
  try {
    if (!winnerId) {
      throw new Error('Winner ID is required');
    }
    
    if (!trophy.competition || !trophy.competition.trim()) {
      throw new Error('Competition name is required');
    }
    
    const response = await api.delete(`/${winnerId}/trophies`, {
      data: { competition: trophy.competition.trim() }
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting trophy from winner ${winnerId}:`, error.message);
    throw error;
  }
};

// DELETE /api/winners/:id - Delete player
export const deleteWinner = async (id) => {
  try {
    if (!id) {
      throw new Error('Winner ID is required');
    }
    
    const response = await api.delete(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting winner ${id}:`, error.message);
    throw error;
  }
};

// Utility function to handle API errors consistently
export const handleApiError = (error) => {
  if (error.status === 404) {
    return 'Resource not found';
  } else if (error.status === 409) {
    return 'Resource already exists';
  } else if (error.status >= 400 && error.status < 500) {
    return error.message || 'Bad request';
  } else if (error.status >= 500) {
    return 'Server error - please try again later';
  }
  return error.message || 'An unexpected error occurred';
};

export default {
  getWinners,
  getWinnerById,
  createWinner,
  addTrophy,
  updateTrophy,
  deleteTrophy,
  deleteWinner,
  handleApiError
};
