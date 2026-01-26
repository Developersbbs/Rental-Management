// services/userService.js - Updated with correct API endpoints
import axios from './axiosInstance';

const userService = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await axios.get('/api/users');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Redirect to login if unauthorized
        window.location.href = '/login';
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  // Get user statistics
  getUserStats: async () => {
    try {
      const response = await axios.get('/api/users/stats');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
      // Return default stats if endpoint doesn't exist
      if (error.response?.status === 404) {
        return { 
          total: 0, 
          superadmin: 0, 
          stockmanager: 0, 
          billcounter: 0 
        };
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch stats');
    }
  },

  // Get user by ID
  getUserById: async (id) => {
    try {
      const response = await axios.get(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await axios.post('/users', userData);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
      throw new Error(error.response?.data?.message || 'Failed to create user');
    }
  },

  // Update user
  updateUser: async (id, userData) => {
    try {
      const response = await axios.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  },

  // Update user password
  updateUserPassword: async (id, passwordData) => {
    try {
      const response = await axios.put(`/users/${id}/password`, passwordData);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
      throw new Error(error.response?.data?.message || 'Failed to update password');
    }
  },

  // Delete user
  deleteUser: async (id) => {
    try {
      const response = await axios.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  }
};

export default userService;