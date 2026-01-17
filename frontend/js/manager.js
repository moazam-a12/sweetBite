// Manager Panel JavaScript - Frontend

// Protect all manager pages
if (typeof requireRole === 'function') {
  requireRole('manager', 'admin');
}

/* =========================
   UTILITY FUNCTIONS
========================= */

function showSuccessMessage(message) {
  const alert = document.createElement('div');
  alert.className = 'success-notification';
  alert.innerHTML = `
    <div class="success-notification-icon">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    </div>
    <div class="success-notification-content">
      <div class="success-notification-title">Success</div>
      <div class="success-notification-message">${message}</div>
    </div>
  `;
  document.body.appendChild(alert);
  
  setTimeout(() => {
    alert.remove();
  }, 3000);
}

function showErrorMessage(message) {
  alert(message);
}

/* =========================
   DASHBOARD STATS
========================= */

async function loadDashboardStats() {
  try {
    const [users, products, orders] = await Promise.all([
      fetch('http://localhost:5001/api/manager/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(r => r.json()).catch(() => []),
      
      API.getStock().catch(() => []),
      
      fetch('http://localhost:5001/api/orders', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(r => r.json()).catch(() => [])
    ]);

    // Update stats
    const totalUsersEl = document.querySelector('#totalUsers');
    const totalProductsEl = document.querySelector('#totalProducts');
    const totalOrdersEl = document.querySelector('#totalOrders');
    const pendingOrdersEl = document.querySelector('#pendingOrders');
    const lowStockItemsEl = document.querySelector('#lowStockItems');

    if (totalUsersEl) totalUsersEl.textContent = users.length;
    if (totalProductsEl) totalProductsEl.textContent = products.length;
    if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
    
    const pending = orders.filter(o => o.status === 'Pending').length;
    if (pendingOrdersEl) pendingOrdersEl.textContent = pending;
    
    const lowStock = products.filter(p => p.stock && p.stock.status === 'Low Stock').length;
    if (lowStockItemsEl) lowStockItemsEl.textContent = lowStock;

  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

/* =========================
   USER MANAGEMENT
========================= */

let users = [];

async function loadUsers() {
  try {
    const response = await fetch('http://localhost:5001/api/manager/users', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to load users');
    
    users = await response.json();
    renderUsers();
  } catch (error) {
    console.error('Error loading users:', error);
    showErrorMessage('Failed to load users');
  }
}

function renderUsers() {
  const tbody = document.querySelector('#usersBody');
  
  if (!tbody) return;
  
  if (!users.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:40px;color:var(--apple-gray);">
          No users found
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td><span class="role-badge role-${user.role}">${user.role}</span></td>
      <td>${new Date(user.createdAt).toLocaleDateString()}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-small btn-edit" onclick='editUser(${JSON.stringify(user)})'>
            Edit
          </button>
          <button class="btn-small btn-delete-small" onclick="deleteUser('${user._id}', '${user.name}')">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddUserModal() {
  document.querySelector('#modalTitle').textContent = 'Add New User';
  document.querySelector('#userForm').reset();
  document.querySelector('#userId').value = '';
  document.querySelector('#isEdit').value = 'false';
  document.querySelector('#passwordHint').style.display = 'none';
  document.querySelector('#userPassword').required = true;
  document.querySelector('#userModal').style.display = 'flex';
}

function editUser(user) {
  document.querySelector('#modalTitle').textContent = 'Edit User';
  document.querySelector('#userId').value = user._id;
  document.querySelector('#isEdit').value = 'true';
  document.querySelector('#userName').value = user.name;
  document.querySelector('#userEmail').value = user.email;
  document.querySelector('#userRole').value = user.role;
  document.querySelector('#userPassword').value = '';
  document.querySelector('#userPassword').required = false;
  document.querySelector('#passwordHint').style.display = 'block';
  document.querySelector('#userModal').style.display = 'flex';
}

function closeUserModal() {
  document.querySelector('#userModal').style.display = 'none';
  document.querySelector('#userForm').reset();
}

async function handleSaveUser(e) {
  e.preventDefault();
  
  const userId = document.querySelector('#userId').value;
  const isEdit = document.querySelector('#isEdit').value === 'true';
  const password = document.querySelector('#userPassword').value;
  
  const userData = {
    name: document.querySelector('#userName').value,
    email: document.querySelector('#userEmail').value,
    role: document.querySelector('#userRole').value
  };

  // Only include password if provided
  if (password || !isEdit) {
    userData.password = password;
  }

  try {
    const url = isEdit 
      ? `http://localhost:5001/api/manager/user/${userId}`
      : 'http://localhost:5001/api/manager/user';
    
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    closeUserModal();
    loadUsers();
    
    showSuccessMessage(isEdit ? 'User updated successfully' : 'User created successfully');

  } catch (error) {
    showErrorMessage(error.message || 'Failed to save user');
  }
}

async function deleteUser(id, name) {
  if (!confirm(`Delete user "${name}"? This cannot be undone.`)) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:5001/api/manager/user/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message);
    }

    loadUsers();
    showSuccessMessage('User deleted successfully');

  } catch (error) {
    showErrorMessage(error.message || 'Failed to delete user');
  }
}

/* =========================
   ORDER MANAGEMENT
========================= */

async function loadOrders() {
  const container = document.querySelector('#ordersContainer');
  if (!container) return;
  
  const statusFilter = document.querySelector('#statusFilter')?.value || 'all';
  const startDate = document.querySelector('#startDate')?.value || '';
  const endDate = document.querySelector('#endDate')?.value || '';

  try {
    let url = 'http://localhost:5001/api/manager/orders/all?';
    
    if (statusFilter !== 'all') url += `status=${statusFilter}&`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to load orders');
    
    const orders = await response.json();

    if (!orders.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h3>No orders found</h3>
          <p>Try adjusting your filters</p>
        </div>`;
      return;
    }

    container.innerHTML = orders.map(order => `
      <div class="order-card">
        <div class="order-header">
          <div>
            <div class="order-id">${order.orderId}</div>
            <div class="order-meta">
              ${order.customerId ? `${order.customerId.name} (${order.customerId.email})` : 'Guest'}
            </div>
          </div>
          <span class="badge badge-info">${order.status}</span>
        </div>

        <div class="order-details">
          <div class="order-detail-item">
            <strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}
          </div>
          <div class="order-detail-item">
            <strong>Items:</strong> ${order.items.length}
          </div>
          <div class="order-detail-item">
            <strong>Total:</strong> RS${order.total.toFixed(2)}
          </div>
          <div class="order-detail-item">
            <strong>Payment:</strong> ${order.paymentCollected ? '✓ Collected' : '✗ Pending'}
          </div>
        </div>

        <div class="order-items">
          <div class="order-items-title">ORDER ITEMS</div>
          ${order.items.map(item => `
            <div class="order-item">
              <span>${item.name} × ${item.qty}</span>
              <span>RS${(item.price * item.qty).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>

        ${order.shipping.addr1 !== 'In-store pickup' ? `
          <div class="order-items" style="margin-top:12px;">
            <div class="order-items-title">DELIVERY ADDRESS</div>
            <div style="font-size:0.9rem;line-height:1.6;color:var(--apple-dark);">
              ${order.shipping.name}<br>
              ${order.shipping.addr1}${order.shipping.addr2 ? ', ' + order.shipping.addr2 : ''}<br>
              ${order.shipping.city}, ${order.shipping.postal}<br>
              ${order.shipping.phone}
            </div>
          </div>
        ` : ''}

        <div class="order-actions">
          <select class="status-select" data-order-id="${order._id}" onchange="updateOrderStatus('${order._id}', this.value)">
            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
            <option value="Ready" ${order.status === 'Ready' ? 'selected' : ''}>Ready</option>
            <option value="Picked Up" ${order.status === 'Picked Up' ? 'selected' : ''}>Picked Up</option>
            <option value="Out for Delivery" ${order.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          </select>
          <button class="btn-small btn-delete-small" onclick="deleteOrder('${order._id}', '${order.orderId}')">
            Delete
          </button>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading orders:', error);
    container.innerHTML = `
      <div class="empty-state">
        <h3>Failed to load orders</h3>
        <p>${error.message}</p>
      </div>`;
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(`http://localhost:5001/api/manager/order/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      throw new Error('Failed to update status');
    }

    showSuccessMessage('Order status updated');
    loadOrders();

  } catch (error) {
    showErrorMessage(error.message);
    loadOrders();
  }
}

async function deleteOrder(orderId, orderNumber) {
  if (!confirm(`Delete order ${orderNumber}? This cannot be undone.`)) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:5001/api/manager/order/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete order');
    }

    showSuccessMessage('Order deleted successfully');
    loadOrders();

  } catch (error) {
    showErrorMessage(error.message);
  }
}

function clearFilters() {
  const statusFilter = document.querySelector('#statusFilter');
  const startDate = document.querySelector('#startDate');
  const endDate = document.querySelector('#endDate');
  
  if (statusFilter) statusFilter.value = 'all';
  if (startDate) startDate.value = '';
  if (endDate) endDate.value = '';
  
  loadOrders();
}

/* =========================
   ANALYTICS
========================= */

async function loadAnalytics() {
  await loadOverview();
  await loadPopularProducts();
  await loadTopCustomers();
  await loadInventoryStatus();
}

async function loadOverview() {
  try {
    const response = await fetch('http://localhost:5001/api/manager/analytics/overview', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();

    const totalOrdersEl = document.querySelector('#totalOrders');
    const totalRevenueEl = document.querySelector('#totalRevenue');
    const totalCustomersEl = document.querySelector('#totalCustomers');
    const completedOrdersEl = document.querySelector('#completedOrders');

    if (totalOrdersEl) totalOrdersEl.textContent = data.orders.total;
    if (totalRevenueEl) totalRevenueEl.textContent = `RS${data.revenue.total.toFixed(2)}`;
    if (totalCustomersEl) totalCustomersEl.textContent = data.customers.total;
    if (completedOrdersEl) completedOrdersEl.textContent = data.orders.completed;

  } catch (error) {
    console.error('Error loading overview:', error);
  }
}

async function loadPopularProducts() {
  try {
    const response = await fetch('http://localhost:5001/api/manager/analytics/popular-products', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const products = await response.json();

    const container = document.querySelector('#popularProducts');
    if (!container) return;
    
    if (!products.length) {
      container.innerHTML = '<p style="text-align:center;color:var(--apple-gray);">No sales data yet</p>';
      return;
    }

    const maxSales = Math.max(...products.map(p => p.totalSales));

    container.innerHTML = products.slice(0, 10).map(product => `
      <div class="data-row">
        <div style="flex:1;">
          <div class="data-label">${product.product}</div>
          <div class="data-value" style="font-size:0.85rem;margin-top:4px;">
            ${product.category} • RS${product.price.toFixed(2)}
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${(product.totalSales / maxSales * 100).toFixed(1)}%"></div>
          </div>
        </div>
        <div style="text-align:right;margin-left:20px;">
          <div class="data-label">${product.totalSales} sold</div>
          <div class="data-value" style="margin-top:4px;">
            RS${product.revenue.toFixed(2)}
          </div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading popular products:', error);
  }
}

async function loadTopCustomers() {
  try {
    const response = await fetch('http://localhost:5001/api/manager/analytics/customer-insights', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const customers = await response.json();

    const container = document.querySelector('#topCustomers');
    if (!container) return;
    
    if (!customers.length) {
      container.innerHTML = '<p style="text-align:center;color:var(--apple-gray);">No customer data yet</p>';
      return;
    }

    const maxSpent = Math.max(...customers.map(c => c.totalSpent));

    container.innerHTML = customers.slice(0, 10).map(customer => `
      <div class="data-row">
        <div style="flex:1;">
          <div class="data-label">${customer.name}</div>
          <div class="data-value" style="font-size:0.85rem;margin-top:4px;">
            ${customer.email}
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${(customer.totalSpent / maxSpent * 100).toFixed(1)}%"></div>
          </div>
        </div>
        <div style="text-align:right;margin-left:20px;">
          <div class="data-label">RS${customer.totalSpent.toFixed(2)}</div>
          <div class="data-value" style="margin-top:4px;">
            ${customer.orderCount} orders • Avg: RS${customer.avgOrderValue.toFixed(2)}
          </div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading top customers:', error);
  }
}

async function loadInventoryStatus() {
  try {
    const products = await API.getStock();
    const container = document.querySelector('#inventoryStatus');
    
    if (!container) return;

    const inStock = products.filter(p => p.stock && p.stock.status === 'In Stock').length;
    const lowStock = products.filter(p => p.stock && p.stock.status === 'Low Stock').length;
    const outOfStock = products.filter(p => p.stock && p.stock.status === 'Out of Stock').length;
    const total = products.length || 1;

    container.innerHTML = `
      <div class="data-row">
        <div class="data-label">In Stock</div>
        <div class="data-value">
          ${inStock} products (${(inStock / total * 100).toFixed(1)}%)
          <div class="progress-bar">
            <div class="progress-fill" style="width:${(inStock / total * 100).toFixed(1)}%;background:#4caf50;"></div>
          </div>
        </div>
      </div>
      <div class="data-row">
        <div class="data-label">Low Stock</div>
        <div class="data-value">
          ${lowStock} products (${(lowStock / total * 100).toFixed(1)}%)
          <div class="progress-bar">
            <div class="progress-fill" style="width:${(lowStock / total * 100).toFixed(1)}%;background:#ff9800;"></div>
          </div>
        </div>
      </div>
      <div class="data-row">
        <div class="data-label">Out of Stock</div>
        <div class="data-value">
          ${outOfStock} products (${(outOfStock / total * 100).toFixed(1)}%)
          <div class="progress-bar">
            <div class="progress-fill" style="width:${(outOfStock / total * 100).toFixed(1)}%;background:#f44336;"></div>
          </div>
        </div>
      </div>
    `;

  } catch (error) {
    console.error('Error loading inventory status:', error);
  }
}

/* =========================
   EXPOSE GLOBAL FUNCTIONS
========================= */

window.openAddUserModal = openAddUserModal;
window.editUser = editUser;
window.closeUserModal = closeUserModal;
window.deleteUser = deleteUser;
window.loadOrders = loadOrders;
window.updateOrderStatus = updateOrderStatus;
window.deleteOrder = deleteOrder;
window.clearFilters = clearFilters;