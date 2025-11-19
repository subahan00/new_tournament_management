import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api/wallpaper`;

// Helper function
const getAuthToken = () => {
  let token = localStorage.getItem('authToken');
  if (!token) {
    token = sessionStorage.getItem('authToken');
  }
  return token;
};

export const uploadWallpaper = async (wallpaperData) => {
  const token = getAuthToken(); // ✅ FIXED
  
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
    console.error('Upload error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    throw error.response?.data || error.message;
  }
};

export const getAllWallpapersAdmin = async (page = 1, limit = 20) => {
  const token = getAuthToken(); // ✅ FIXED - removed token from params
  return axios.get(`${API_BASE_URL}/admin/all`, {
    params: {
      page,
      limit
    },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const updateWallpaper = async (id, updatedData) => {
  const token = getAuthToken(); // ✅ FIXED - removed token from params
  return axios.put(`${API_BASE_URL}/admin/${id}`, updatedData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const deleteWallpaper = async (id) => {
  const token = getAuthToken(); // ✅ FIXED - removed token from params
  return axios.delete(`${API_BASE_URL}/admin/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

// Public routes remain the same
export const getPublicWallpapers = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return axios.get(`${API_BASE_URL}/public?${query}`);
};

export const getWallpaperById = async (id) => {
  return axios.get(`${API_BASE_URL}/public/${id}`);
};

export const downloadWallpaper = async (id) => {
  return axios.post(`${API_BASE_URL}/public/${id}/download`);
};

export const likeWallpaper = async (id) => {
  return axios.post(`${API_BASE_URL}/public/${id}/like`);
};

export const getFeaturedWallpapers = async () => {
  return axios.get(`${API_BASE_URL}/public/featured`);
};

export const getWallpaperCategories = async () => {
  return axios.get(`${API_BASE_URL}/public/categories`);
};

export const getWallpaperTags = async () => {
  return axios.get(`${API_BASE_URL}/public/tags`);
};