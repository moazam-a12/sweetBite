// Chef Panel JavaScript - Backend Integrated

// Protect this page
if (typeof requireRole === 'function') {
  requireRole('chef', 'manager', 'admin');
}

document.addEventListener("DOMContentLoaded", () => {
  // Dashboard
  if (document.querySelector("#ordersGrid")) {
    loadPendingOrders();
    loadStats();
  }
  
  // All Orders page
  if (document.querySelector("#allOrdersGrid")) {
    loadAllOrders();
  }
  
  // History page
  if (document.querySelector("#historyGrid")) {
    loadHistory();
  }
});

/* =========================
   LOAD DASHBOARD STATS
========================= */
async function loadStats() {
  try {
    const response = await fetch('http://localhost:5001/api/chef/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const stats = await response.json();
    
    document.querySelector("#pendingCount").textContent = stats.pending;
    document.querySelector("#preparingCount").textContent = stats.preparing;
    document.querySelector("#readyCount").textContent = stats.ready;
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

/* =========================
   LOAD PENDING ORDERS (DASHBOARD)
========================= */
async function loadPendingOrders() {
  const container = document.querySelector("#ordersGrid");
  if (!container) return;

  try {
    const response = await fetch('http://localhost:5001/api/chef/pending', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const orders = await response.json();
    
    if (!orders.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✅</div>
          <h3>All caught up!</h3>
          <p>No pending orders at the moment</p>
        </div>`;
      return;
    }

    container.innerHTML = orders.map(order => renderOrderCard(order, true)).join('');
  } catch (error) {
    console.error("Error loading pending orders:", error);
  }
}

/* =========================
   LOAD ALL ACTIVE ORDERS
========================= */
async function loadAllOrders() {
  const container = document.querySelector("#allOrdersGrid");
  if (!container) return;

  try {
    const response = await fetch('http://localhost:5001/api/chef/active', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const orders = await response.json();
    
    if (!orders.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h3>No active orders</h3>
          <p>All orders have been completed</p>
        </div>`;
      return;
    }

    container.innerHTML = orders.map(order => renderOrderCard(order, true)).join('');
  } catch (error) {
    console.error("Error loading orders:", error);
  }
}

/* =========================
   LOAD ORDER HISTORY
========================= */
async function loadHistory() {
  const container = document.querySelector("#historyGrid");
  if (!container) return;

  try {
    const response = await fetch('http://localhost:5001/api/chef/history', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const orders = await response.json();
    
    if (!orders.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📜</div>
          <h3>No history yet</h3>
          <p>Completed orders will appear here</p>
        </div>`;
      return;
    }

    container.innerHTML = orders.map(order => renderOrderCard(order, false)).join('');
  } catch (error) {
    console.error("Error loading history:", error);
  }
}

/* =========================
   RENDER ORDER CARD
========================= */
function renderOrderCard(order, canEdit) {
  const date = new Date(order.createdAt);
  const time = date.toLocaleString();
  
  const itemsList = order.items.map(item => 
    `<div class="order-item">
      <span class="order-item-name">${item.name}</span>
      <span class="order-item-qty">×${item.qty}</span>
    </div>`
  ).join('');

  let badgeClass = 'badge-warning';
  if (order.status === 'Ready') badgeClass = 'badge-info';
  if (order.status === 'Preparing') badgeClass = 'badge-warning';
  if (order.status === 'Delivered') badgeClass = 'badge-success';
  if (order.status === 'Out for Delivery') badgeClass = 'badge-info';
  if (order.status === 'Picked Up') badgeClass = 'badge-info';

  const statusControl = canEdit ? `
    <div class="order-status-control">
      <select class="status-select" onchange="updateOrderStatus('${order._id}', this.value)">
        <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
        <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
        <option value="Ready" ${order.status === 'Ready' ? 'selected' : ''}>Ready</option>
      </select>
    </div>
  ` : `<span class="badge ${badgeClass}">${order.status}</span>`;

  return `
    <div class="order-card">
      <div class="order-header">
        <div>
          <div class="order-id">${order.orderId}</div>
          <div class="order-time">${time}</div>
        </div>
        ${!canEdit ? `<span class="badge ${badgeClass}">${order.status}</span>` : ''}
      </div>
      <div class="order-items">
        ${itemsList}
      </div>
      <div class="order-footer">
        <div class="order-total">Total: $${order.total.toFixed(2)}</div>
        ${statusControl}
      </div>
    </div>
  `;
}

/* =========================
   UPDATE ORDER STATUS
========================= */
window.updateOrderStatus = async function(orderId, newStatus) {
  try {
    const response = await fetch(`http://localhost:5001/api/chef/order/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    // Show success feedback
    showToast(`Order updated to ${newStatus}`);
    
    // Reload current view
    if (document.querySelector("#ordersGrid")) {
      loadPendingOrders();
      loadStats();
    } else if (document.querySelector("#allOrdersGrid")) {
      loadAllOrders();
    }

  } catch (error) {
    console.error("Error updating order:", error);
    alert(error.message || "Failed to update order");
    
    // Reload to reset
    if (document.querySelector("#ordersGrid")) {
      loadPendingOrders();
    } else if (document.querySelector("#allOrdersGrid")) {
      loadAllOrders();
    }
  }
};

/* =========================
   TOAST NOTIFICATION
========================= */
function showToast(message) {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: var(--apple-dark);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    z-index: 10000;
    font-size: 0.95rem;
    animation: slideInRight 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}