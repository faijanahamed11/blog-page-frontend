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

// Add request interceptor to log requests and add JWT token
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

// Add response interceptor to log responses
api.interceptors.response.use(
  (response) => {

    return response;
  },
  (error) => {

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  checkAuth: () => api.get('/auth/check'),
  register: (username, password) => api.post('/auth/register', { username, password }),
  login: (username, password) => api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Posts API
export const postsAPI = {
  getAllPosts: (search = '', type = 'content', category = 'all') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (type) params.append('type', type);
    if (category && category !== 'all') params.append('category', category);
    return api.get(`/posts?${params.toString()}`);
  },
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (content, category = 'general') => api.post('/posts', { content, category }),
  updatePost: (id, content) => api.put(`/posts/${id}`, { content }),
  deletePost: (id) => api.delete(`/posts/${id}`),
  getMyPosts: () => api.get('/posts/user/myposts'),
  addComment: (postId, text) => api.post(`/posts/${postId}/comments`, { text }),
  deleteComment: (postId, commentId) => api.delete(`/posts/${postId}/comments/${commentId}`),
};

export default api;
