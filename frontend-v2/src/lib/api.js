import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  verify: () => api.post('/auth/verify'),
};

// Forms API
export const formsAPI = {
  create: (data) => api.post('/forms', data),
  createForm: (data) => api.post('/forms', data), // Alias for FormBuilder
  getVendorForms: () => api.get('/forms/vendor/my'),
  getFormById: (id) => api.get(`/forms/${id}`),
  getForm: (id) => api.get(`/forms/${id}`), // Alias for FormBuilder
  getVendorFormById: (id) => api.get(`/forms/vendor/${id}`),
  update: (id, data) => api.put(`/forms/${id}`, data),
  updateForm: (id, data) => api.put(`/forms/${id}`, data), // Alias for FormBuilder
  delete: (id) => api.delete(`/forms/${id}`),
  getEntries: (id, params) => api.get(`/forms/${id}/entries`, { params }),
  getStats: (id) => api.get(`/forms/${id}/stats`),
  resubmit: (id) => api.post(`/forms/${id}/resubmit`),
  submitFeedback: (id, data) => api.post(`/forms/${id}/submit`, data),
};

// Alias for FormBuilder compatibility
export const formAPI = formsAPI;

// QR Code API
export const qrAPI = {
  generate: (formId) => api.post(`/qr/forms/${formId}/generate`),
  get: (formId) => api.get(`/qr/forms/${formId}`),
  regenerate: (formId) => api.put(`/qr/forms/${formId}/regenerate`),
  toggle: (formId) => api.patch(`/qr/forms/${formId}/toggle`),
  setExpiry: (formId, data) => api.patch(`/qr/forms/${formId}/expiry`, data),
  getAnalytics: (formId) => api.get(`/qr/forms/${formId}/analytics`),
  download: (formId) => api.get(`/qr/forms/${formId}/download`),
  getAll: () => api.get('/qr/all'),
  bulkGenerate: (data) => api.post('/qr/bulk-generate', data),
};

// Business API
export const businessAPI = {
  getProfile: (slug) => api.get(`/business/${slug}`),
  getReviews: (slug) => api.get(`/business/${slug}/reviews`),
  submitReview: (slug, data) => api.post(`/business/${slug}/reviews`, data),
  getForms: (slug) => api.get(`/business/${slug}/forms`),
  getUserProfile: () => api.get('/business/profile/me'),
  updateProfile: (data) => api.post('/business/profile', data),
  deleteProfile: () => api.delete('/business/profile'),
};

// AI API
export const aiAPI = {
  analyzeSentiment: (formId, data) => api.post(`/ai/forms/${formId}/analyze-sentiment`, data),
  bulkAnalyzeSentiment: (data) => api.post('/ai/bulk-analyze-sentiment', data),
  getInsights: (formId) => api.get(`/ai/forms/${formId}/insights`),
  getDashboard: () => api.get('/ai/dashboard'),
  getRecommendations: (formId) => api.get(`/ai/forms/${formId}/recommendations`),
  getTopQualityUsers: () => api.get('/ai/top-quality-users'),
  generateTemplate: (data) => api.post('/ai/generate-template', data),
};

// Subscription API
export const subscriptionAPI = {
  getPlans: () => api.get('/subscriptions/plans'),
  getCurrent: () => api.get('/subscriptions/current'),
  create: (data) => api.post('/subscriptions/create', data),
  cancel: () => api.post('/subscriptions/cancel'),
  createBillingPortal: () => api.post('/subscriptions/billing-portal'),
  checkUsage: () => api.get('/subscriptions/usage'),
};

// Admin API
export const adminAPI = {
  // Dashboard endpoints
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getStats: () => api.get('/admin/stats'),
  getRecentActivity: () => api.get('/admin/recent-activity'),
  getAnalytics: () => api.get('/admin/analytics'),
  getPendingApprovals: () => api.get('/admin/pending-approvals'),
  
  // Business management endpoints
  getPendingBusinesses: () => api.get('/admin/businesses/pending'),
  getBusinesses: () => api.get('/admin/businesses'),
  approveBusiness: (id, data = {}) => api.post(`/admin/businesses/${id}/approve`, data),
  rejectBusiness: (id, data = {}) => api.post(`/admin/businesses/${id}/reject`, data),
  suspendBusiness: (id, data = {}) => api.post(`/admin/businesses/${id}/suspend`, data),
  reactivateBusiness: (id, data = {}) => api.post(`/admin/businesses/${id}/reactivate`, data),
  deleteBusiness: (id) => api.delete(`/admin/businesses/${id}`),
  updateBusinessStatus: (id, data) => api.patch(`/admin/businesses/${id}/status`, data),
  
  // User management endpoints
  getUsers: () => api.get('/admin/users'),
  activateUser: (userId, data = {}) => api.post(`/admin/users/${userId}/activate`, data),
  suspendUser: (userId, data = {}) => api.post(`/admin/users/${userId}/suspend`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  updateUserStatus: (userId, data) => api.patch(`/admin/users/${userId}/status`, data),
  
  // Form management endpoints
  getPendingForms: () => api.get('/admin/forms/pending'),
  getAllForms: () => api.get('/admin/forms'),
  approveForm: (id, data) => api.post(`/admin/forms/${id}/approve`, data),
  rejectForm: (id, data) => api.post(`/admin/forms/${id}/reject`, data),
  
  // System settings endpoints
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.post('/admin/settings', data),
  
  // Other admin endpoints
  getSubscriptions: () => api.get('/admin/subscriptions'),
  getFlaggedContent: () => api.get('/admin/flagged-content'),
};

// Feedback API
export const feedbackAPI = {
  getEntry: (entryId) => api.get(`/feedback/${entryId}`),
  updateFlag: (entryId, data) => api.patch(`/feedback/${entryId}/flag`, data),
};

// Public API (no authentication required)
export const publicAPI = {
  getForm: (businessId, formId) => api.get(`/forms/${formId}`),
  getBusiness: (businessId) => api.get(`/business/${businessId}`),
  submitForm: (businessId, formId, data) => api.post(`/forms/${formId}/submit`, data),
  getBusinessForms: (businessId) => api.get(`/business/${businessId}/forms`),
  getBusinessStats: (businessId) => api.get(`/business/${businessId}/stats`),
};

export default api;
