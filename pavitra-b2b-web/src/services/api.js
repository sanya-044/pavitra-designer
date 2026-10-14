/**
 * Pavitra B2B Centralized HTTP Client
 * Manages API Base URL, Bearer Token injection, JSON headers, and error formatting.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const TOKEN_STORAGE_KEY = 'pavitra_auth_token';
const USER_STORAGE_KEY = 'pavitra_user';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_STORAGE_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_STORAGE_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_STORAGE_KEY),
  getUser: () => {
    try {
      const data = localStorage.getItem(USER_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)),
  clearUser: () => localStorage.removeItem(USER_STORAGE_KEY),
  clearAll: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

/**
 * Universal request wrapper
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = authStorage.getToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(url, config);

    // Parse JSON response body if present
    let data = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = { message: await res.text() };
    }

    if (!res.ok) {
      const errorMessage = data?.message || `Request failed with status ${res.status}`;
      const error = new Error(errorMessage);
      error.status = res.status;
      error.errors = data?.errors;
      throw error;
    }

    return data;
  } catch (error) {
    // If token expired or account suspended, optionally notify or bubble
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Auth API Endpoints
// ---------------------------------------------------------------------------
export const authApi = {
  login: async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.data?.token) {
      authStorage.setToken(res.data.token);
      authStorage.setUser(res.data.user);
    }
    return res;
  },

  register: async (payload) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.data?.token) {
      authStorage.setToken(res.data.token);
      authStorage.setUser(res.data.user);
    }
    return res;
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      authStorage.clearAll();
    }
  }
};

// ---------------------------------------------------------------------------
// Catalog & Product Endpoints
// ---------------------------------------------------------------------------
export const productApi = {
  getProducts: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.set('category', params.category);
    if (params.q) query.set('q', params.q);
    if (params.fabric && params.fabric !== 'All') query.set('fabric', params.fabric);
    if (params.minPrice) query.set('minPrice', params.minPrice);
    if (params.maxPrice) query.set('maxPrice', params.maxPrice);
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);

    const queryString = query.toString();
    return apiRequest(`/products${queryString ? `?${queryString}` : ''}`);
  },

  getCategories: async () => {
    return apiRequest('/products/categories');
  },

  getProductById: async (id) => {
    return apiRequest(`/products/${id}`);
  },

  createProduct: async (productData) => {
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  updateProduct: async (id, updateData) => {
    return apiRequest(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
  },

  deleteProduct: async (id) => {
    return apiRequest(`/products/${id}`, {
      method: 'DELETE'
    });
  }
};

// ---------------------------------------------------------------------------
// Cart (B2B Bag) Endpoints
// ---------------------------------------------------------------------------
export const cartApi = {
  getCart: async () => {
    return apiRequest('/cart');
  },

  addItem: async (productId, quantity) => {
    return apiRequest('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });
  },

  updateItem: async (productId, quantity) => {
    return apiRequest(`/cart/items/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity })
    });
  },

  removeItem: async (productId) => {
    return apiRequest(`/cart/items/${productId}`, {
      method: 'DELETE'
    });
  },

  clearCart: async () => {
    return apiRequest('/cart', {
      method: 'DELETE'
    });
  }
};

// ---------------------------------------------------------------------------
// Wishlist Endpoints
// ---------------------------------------------------------------------------
export const wishlistApi = {
  getWishlist: async () => {
    return apiRequest('/wishlist');
  },

  addItem: async (productId) => {
    return apiRequest('/wishlist/items', {
      method: 'POST',
      body: JSON.stringify({ productId })
    });
  },

  removeItem: async (productId) => {
    return apiRequest(`/wishlist/items/${productId}`, {
      method: 'DELETE'
    });
  }
};

// ---------------------------------------------------------------------------
// Orders & Inquiries Endpoints
// ---------------------------------------------------------------------------
export const orderApi = {
  createOrder: async (orderData) => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  getMyOrders: async () => {
    return apiRequest('/orders/my');
  },

  getOrderById: async (id) => {
    return apiRequest(`/orders/${id}`);
  },

  createInquiry: async (inquiryData) => {
    return apiRequest('/inquiries', {
      method: 'POST',
      body: JSON.stringify(inquiryData)
    });
  },

  getMyInquiries: async () => {
    return apiRequest('/inquiries/my');
  }
};

// ---------------------------------------------------------------------------
// Seller Portal Endpoints
// ---------------------------------------------------------------------------
export const sellerApi = {
  getStats: async () => {
    return apiRequest('/seller/dashboard/stats');
  },

  getProducts: async () => {
    return apiRequest('/seller/products');
  },

  getOrders: async () => {
    return apiRequest('/seller/orders');
  },

  updateOrderStatus: async (id, status) => {
    return apiRequest(`/seller/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  getInquiries: async () => {
    return apiRequest('/seller/inquiries');
  },

  submitQuote: async (id, quoteData) => {
    return apiRequest(`/seller/inquiries/${id}/quote`, {
      method: 'PATCH',
      body: JSON.stringify(quoteData)
    });
  },

  updateProfile: async (profileData) => {
    return apiRequest('/seller/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    });
  }
};

// ---------------------------------------------------------------------------
// Admin Portal Endpoints
// ---------------------------------------------------------------------------
export const adminApi = {
  getStats: async () => {
    return apiRequest('/admin/dashboard/stats');
  },

  getUsers: async (params = {}) => {
    const query = new URLSearchParams(params);
    const queryString = query.toString();
    return apiRequest(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  getUserById: async (id) => {
    return apiRequest(`/admin/users/${id}`);
  },

  updateUserStatus: async (id, status) => {
    return apiRequest(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  updateUserVerification: async (id, status) => {
    return apiRequest(`/admin/users/${id}/verification`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  getProducts: async () => {
    return apiRequest('/admin/products');
  },

  getOrders: async () => {
    return apiRequest('/admin/orders');
  },

  updateOrderStatus: async (id, status) => {
    return apiRequest(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  getInquiries: async () => {
    return apiRequest('/admin/inquiries');
  },

  updateInquiryStatus: async (id, status) => {
    return apiRequest(`/admin/inquiries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
};
