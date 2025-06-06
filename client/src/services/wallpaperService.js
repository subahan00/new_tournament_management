import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api/wallpaper`; // Change to your actual backend base URL

// --------------------------- ADMIN ROUTES ---------------------------

// Upload a wallpaper (admin only)
// Import or get token from storage (example using localStorage)
const token = localStorage.getItem('authToken') || '';

export const uploadWallpaper = async (wallpaperData) => {
  // Get token from storage - IMPORTANT: Do this inside the function
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  };

  try {
    const response = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/wallpaper/admin/upload`,
      wallpaperData,
      config
    );
    return response.data;
  } catch (error) {
    // Enhanced error logging
    console.error('Upload error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    throw error.response?.data || error.message;
  }
};


// Get all wallpapers (admin)
export const getAllWallpapersAdmin = async (page = 1, limit = 20, token) => {
  return axios.get(`${API_BASE_URL}/admin/all?page=${page}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// Update a wallpaper (admin)
export const updateWallpaper = async (id, updatedData, token) => {
  return axios.put(`${API_BASE_URL}/admin/${id}`, updatedData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// Delete a wallpaper (admin)
export const deleteWallpaper = async (id, token) => {
  return axios.delete(`${API_BASE_URL}/admin/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// --------------------------- PUBLIC ROUTES ---------------------------

// Get public wallpapers with search, pagination, and filters
export const getPublicWallpapers = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return axios.get(`${API_BASE_URL}/public?${query}`);
};

// Get a single wallpaper by ID
export const getWallpaperById = async (id) => {
  return axios.get(`${API_BASE_URL}/public/${id}`);
};

// Track wallpaper download
export const downloadWallpaper = async (id) => {
  return axios.post(`${API_BASE_URL}/public/${id}/download`);
};

// Like a wallpaper
export const likeWallpaper = async (id) => {
  return axios.post(`${API_BASE_URL}/public/${id}/like`);
};

// Get featured wallpapers
export const getFeaturedWallpapers = async () => {
  return axios.get(`${API_BASE_URL}/public/featured`);
};

// Get all wallpaper categories with counts
export const getWallpaperCategories = async () => {
  return axios.get(`${API_BASE_URL}/public/categories`);
};

// Get popular tags
export const getWallpaperTags = async () => {
  return axios.get(`${API_BASE_URL}/public/tags`);
};
