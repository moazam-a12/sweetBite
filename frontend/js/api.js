// API Configuration
const API_BASE_URL = "http://localhost:5001/api";

/* =========================
   Auth Token Helpers
========================= */

function getAuthToken() {
  return localStorage.getItem("token");
}

function setAuthToken(token) {
  localStorage.setItem("token", token);
}

function clearAuthToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
}

/* =========================
   API Request Helper
========================= */

async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}

/* =========================
   API Object (DEFINE FIRST)
========================= */

const API = {
  // Auth
  login(email, password) {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

  signup(name, email, password) {
    return apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
  },

  // Products
  getProducts() {
    return apiRequest("/products");
  },

  addProduct(product) {
    return apiRequest("/products", {
      method: "POST",
      body: JSON.stringify(product)
    });
  },

  // Orders
  getOrders() {
    return apiRequest("/orders");
  },

  createOrder(orderData) {
    return apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify(orderData)
    });
  },

  updateOrderStatus(orderId, status) {
    return apiRequest(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  },

  // Inventory
  getStock() {
    return apiRequest("/inventory");
  },

  addStock(stockData) {
    return apiRequest("/inventory", {
      method: "POST",
      body: JSON.stringify(stockData)
    });
  },

  updateStock(id, stockData) {
    return apiRequest(`/inventory/${id}`, {
      method: "PUT",
      body: JSON.stringify(stockData)
    });
  },

  deleteStock(id) {
    return apiRequest(`/inventory/${id}`, {
      method: "DELETE"
    });
  },

  // Chef endpoints
  getChefPending() {
    return apiRequest("/chef/pending");
  },

  getChefActive() {
    return apiRequest("/chef/active");
  },

  getChefHistory() {
    return apiRequest("/chef/history");
  },

  getChefStats() {
    return apiRequest("/chef/stats");
  },

  updateChefOrderStatus(orderId, status) {
    return apiRequest(`/chef/order/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  },

  // =========================
// Users (Manager/Admin)
// =========================
getUsers() {
    return apiRequest("/users");
  },

  createUser(userData) {
    return apiRequest("/users", {
      method: "POST",
      body: JSON.stringify(userData)
    });
  },

  updateUser(id, userData) {
    return apiRequest(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData)
    });
  },

  deleteUser(id) {
    return apiRequest(`/users/${id}`, {
      method: "DELETE"
    });
  },

  // =========================
// Password Reset
// =========================
checkEmailExists(email) {
  return apiRequest("/auth/check-email", {
    method: "POST",
    body: JSON.stringify({ email })
  });
},

resetPassword(email, password) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

};

/* =========================
   EXPOSE GLOBALLY (IMPORTANT)
========================= */

window.API = API;

console.log("API Loaded:", Object.keys(API));