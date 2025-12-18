import axios from 'axios';

// Use environment variable for API URL, fallback to /api for development with proxy
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token expiration and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      // Token expired or invalid
      if (status === 401) {
        // Clear invalid token
        removeToken();
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/signup')) {
          window.location.href = '/login';
        }
      }
      
      // Handle other errors
      if (status === 403) {
        console.error('Access forbidden');
      }
      
      if (status === 500) {
        console.error('Server error');
      }
    }
    
    return Promise.reject(error);
  }
);

// Token management utilities
export const getToken = () => {
  return localStorage.getItem('token');
};

export const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  }
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    // Decode JWT token to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    
    if (isExpired) {
      removeToken();
      return false;
    }
    
    return true;
  } catch (error) {
    removeToken();
    return false;
  }
};

// Auth APIs
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateFirstLogin: () => api.put('/auth/first-login'),
};

// Machine APIs
export const machineAPI = {
  getAll: () => api.get('/machines'),
  getOne: (id) => api.get(`/machines/${id}`),
  create: (data) => api.post('/machines', data),
  update: (id, data) => api.put(`/machines/${id}`, data),
  delete: (id) => api.delete(`/machines/${id}`),
};

// Worker APIs
export const workerAPI = {
  getAll: () => api.get('/workers'),
  getOne: (id) => api.get(`/workers/${id}`),
  create: (data) => api.post('/workers', data),
  update: (id, data) => api.put(`/workers/${id}`, data),
  delete: (id) => api.delete(`/workers/${id}`),
};

// Production APIs
export const productionAPI = {
  getAll: (params) => api.get('/production', { params }),
  getOne: (id) => api.get(`/production/${id}`),
  create: (data) => api.post('/production', data),
  update: (id, data) => api.put(`/production/${id}`, data),
  delete: (id) => api.delete(`/production/${id}`),
  getStats: (params) => api.get('/production/stats', { params }),
  getDailySummary: (date) => api.get('/production/summary/daily', { params: { date } }),
  getDateSummary: (date) => api.get(`/production/summary/${date}`),
  getSummaries: (params) => api.get('/production/summaries', { params }),
  getWorkerAnalytics: (workerId, params) => api.get(`/production/analytics/worker/${workerId}`, { params }),
  getMachineAnalytics: (machineId, params) => api.get(`/production/analytics/machine/${machineId}`, { params }),
  getElectricityAnalytics: (params) => api.get('/production/analytics/electricity', { params }),
};

// Screenshot APIs
export const screenshotAPI = {
  // Mapping Templates
  getTemplates: () => api.get('/screenshots/templates'),
  getTemplate: (id) => api.get(`/screenshots/templates/${id}`),
  getDefaultTemplate: () => api.get('/screenshots/templates/default'),
  createTemplate: (data) => api.post('/screenshots/templates', data),
  updateTemplate: (id, data) => api.put(`/screenshots/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/screenshots/templates/${id}`),
  
  // Worker Name Mappings
  getWorkerMappings: () => api.get('/screenshots/worker-mappings'),
  createWorkerMapping: (data) => api.post('/screenshots/worker-mappings', data),
  updateWorkerMapping: (id, data) => api.put(`/screenshots/worker-mappings/${id}`, data),
  deleteWorkerMapping: (id) => api.delete(`/screenshots/worker-mappings/${id}`),
  
  // Screenshot Processing
  uploadScreenshot: (formData) => {
    return api.post('/screenshots/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getStatus: (id) => api.get(`/screenshots/status/${id}`),
  getRecords: (params) => api.get('/screenshots/records', { params }),
  verifyData: (id, data) => api.put(`/screenshots/verify/${id}`, data),
  deleteRecord: (id) => api.delete(`/screenshots/records/${id}`),
};

export default api;
