import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mangaloo-backend.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching issues
    config.params = {
      ...config.params,
      _t: Date.now(),
    };

    // Add auth token if available
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Admin token found and added to request');
    } else {
      console.log('❌ No admin token found in localStorage');
    }

    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(
      `✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`
    );
    return response;
  },
  async (error) => {
    const config = error.config;

    console.error(
      `❌ API Error: ${config?.method?.toUpperCase()} ${config?.url} - ${error.response?.status || 'Network Error'}`
    );

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log('🔐 Authentication error - clearing auth data');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');

      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Admin API endpoints
export const adminAPI = {
  login: (credentials) => api.post('/admin/login', credentials),
  getDashboard: () => api.get('/admin/dashboard'),
  getOrders: () => api.get('/admin/orders'),
  getUsers: () => api.get('/admin/users'),
  getShops: () => api.get('/admin/shops'),
  getShoppers: () => api.get('/admin/shoppers'),
  getProducts: () => api.get('/admin/products'),
  getAnalytics: () => api.get('/admin/analytics'),

  // Order management
  updateOrderStatus: (orderId, data) => api.put(`/admin/orders/${orderId}/status`, data),

  // User management
  updateUserStatus: (userId, data) => api.put(`/admin/users/${userId}/status`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

  // Shop management
  createShop: (data) => api.post('/admin/shops', data),
  updateShopStatus: (shopId, data) => api.put(`/admin/shops/${shopId}/status`, data),
  deleteShop: (shopId) => api.delete(`/admin/shops/${shopId}`),

  // Product management
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (productId, data) => api.put(`/admin/products/${productId}`, data),
  deleteProduct: (productId) => api.delete(`/admin/products/${productId}`),

  // Shopper management
  updateShopperStatus: (shopperId, data) => api.put(`/admin/shoppers/${shopperId}`, data),
  deletePersonalShopper: (shopperId) => api.delete(`/admin/shoppers/${shopperId}`),

  // Notice management
  getNotices: (params) => api.get('/notices', { params }),
  createNotice: (data) => api.post('/notices', data),
  updateNotice: (noticeId, data) => api.put(`/notices/${noticeId}`, data),
  deleteNotice: (noticeId) => api.delete(`/notices/${noticeId}`),
};

// Error handling utility
export const handleApiError = (error) => {
  if (!error.response) {
    return {
      message: 'Unable to connect to server. Please check your internet connection.',
      status: 0,
      success: false,
      type: 'NETWORK_ERROR',
    };
  }

  const status = error.response.status;
  const data = error.response.data;

  let message = data?.message || 'An unexpected error occurred';

  switch (status) {
    case 400:
      message = data?.message || 'Invalid request. Please check your input.';
      break;
    case 401:
      message = 'Authentication required. Please log in again.';
      break;
    case 403:
      message = "Access denied. You don't have permission for this action.";
      break;
    case 404:
      message = 'The requested resource was not found.';
      break;
    case 500:
      message = 'Server error. Please try again later.';
      break;
    default:
      message = data?.message || `Server error (${status}). Please try again.`;
  }

  return {
    message,
    status,
    success: false,
    type: 'API_ERROR',
    details: data,
  };
};

export default api;
