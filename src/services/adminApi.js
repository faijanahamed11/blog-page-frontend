import axios from 'axios';

// Use environment variable for production, relative URL for development
const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    // Add JWT token to requests
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Admin API
export const adminAPI = {
  // User management
  getAllUsers: () => api.get('/admin/users'),
  blockUser: (userId, isBlocked) => api.patch(`/admin/users/${userId}/block`, { isBlocked }),
  unblockUser: (userId, isBlocked) => api.patch(`/admin/users/${userId}/block`, { isBlocked }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

  // Post management
  getAllPosts: () => api.get('/admin/posts'),
  deletePost: (postId) => api.delete(`/admin/posts/${postId}`),
  deleteComment: (postId, commentId) => api.delete(`/admin/posts/${postId}/comments/${commentId}`),

  // Statistics
  getStats: () => api.get('/admin/stats'),
};

export default api;
