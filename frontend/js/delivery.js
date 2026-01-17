// Delivery Panel JavaScript - Backend Integrated

// Protect this page
if (typeof requireRole === 'function') {
    requireRole('delivery', 'manager', 'admin');
}

document.addEventListener("DOMContentLoaded", () => {
    // Dashboard
    if (document.querySelector("#deliveryGrid")) {
        loadReadyOrders();
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

    // Order Details page
    if (document.querySelector("#orderDetailsContainer")) {
        loadOrderDetails();
    }
});

/* =========================
   LOAD DASHBOARD STATS
========================= */
async function loadStats() {
    try {
        const response = await fetch('http://localhost:5001/api/delivery/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const stats = await response.json();

        document.querySelector("#readyCount").textContent = stats.ready;
        document.querySelector("#pickedUpCount").textContent = stats.pickedUp;
        document.querySelector("#outForDeliveryCount").textContent = stats.outForDelivery;
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

/* =========================
   LOAD READY ORDERS (DASHBOARD)
========================= */
async function loadReadyOrders() {
    const container = document.querySelector("#deliveryGrid");
    if (!container) return;

    try {
        const response = await fetch('http://localhost:5001/api/delivery/ready', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const orders = await response.json();

        if (!orders.length) {
            container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon">✅</div>
          <h3>All deliveries complete!</h3>
          <p>No orders ready for pickup at the moment</p>
        </div>`;
            return;
        }

        container.innerHTML = orders.map(order => renderDeliveryCard(order)).join('');
    } catch (error) {
        console.error("Error loading ready orders:", error);
    }
}

/* =========================
   LOAD ALL ACTIVE ORDERS
========================= */
async function loadAllOrders() {
    const container = document.querySelector("#allOrdersGrid");
    if (!container) return;

    try {
        const response = await fetch('http://localhost:5001/api/delivery/active', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const orders = await response.json();

        if (!orders.length) {
            container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon">📦</div>
          <h3>No active deliveries</h3>
          <p>All orders have been delivered</p>
        </div>`;
            return;
        }

        container.innerHTML = orders.map(order => renderDeliveryCard(order)).join('');
    } catch (error) {
        console.error("Error loading orders:", error);
    }
}

/* =========================
   LOAD DELIVERY HISTORY
========================= */
async function loadHistory() {
    const container = document.querySelector("#historyGrid");
    if (!container) return;

    try {
        const response = await fetch('http://localhost:5001/api/delivery/history', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const orders = await response.json();

        if (!orders.length) {
            container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon">📜</div>
          <h3>No delivery history</h3>
          <p>Delivered orders will appear here</p>
        </div>`;
            return;
        }

        container.innerHTML = orders.map(order => renderDeliveryCard(order, true)).join('');
    } catch (error) {
        console.error("Error loading history:", error);
    }
}

/* =========================
   RENDER DELIVERY CARD (COMPACT)
========================= */
function renderDeliveryCard(order, isHistory = false) {
    const shipping = order.shipping || {};
    const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
    const itemPreview = order.items.slice(0, 2).map(i => i.name).join(", ");
    const moreItems = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';

    let badgeClass = 'badge-info';
    if (order.status === 'Ready') badgeClass = 'badge-success';
    if (order.status === 'Delivered') badgeClass = 'badge-success';
    if (order.status === 'Out for Delivery') badgeClass = 'badge-warning';

    return `
    <div class="delivery-card">
      <div class="delivery-header">
        <div class="delivery-id">${order.orderId}</div>
        <span class="badge ${badgeClass}">${order.status}</span>
      </div>
      
      <div class="delivery-info">
        <div class="delivery-address">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span>
            ${shipping.addr1 || 'No address'}${shipping.addr2 ? ', ' + shipping.addr2 : ''}<br>
            ${shipping.city || ''}, ${shipping.postal || ''}
          </span>
        </div>
        
        <div class="delivery-items">
          <strong>${itemCount} items:</strong> ${itemPreview}${moreItems}
        </div>
      </div>
      
      <div class="delivery-footer">
        <div style="font-weight:600;color:var(--apple-dark);">RS${order.total.toFixed(2)}</div>
        <a href="order-details.html?id=${order._id}" class="btn-view-details">
          ${isHistory ? 'View Details' : 'View & Deliver'}
        </a>
      </div>
    </div>
  `;
}

/* =========================
   LOAD ORDER DETAILS
========================= */
async function loadOrderDetails() {
    const container = document.querySelector("#orderDetailsContainer");
    if (!container) return;

    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        container.innerHTML = `
      <div class="empty-state">
        <h3>Order not found</h3>
        <a href="dashboard.html" class="btn-apple" style="margin-top:16px;">Back to Dashboard</a>
      </div>`;
        return;
    }

    try {
        const response = await fetch(`http://localhost:5001/api/delivery/order/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Order not found');
        }

        const order = await response.json();
        container.innerHTML = renderOrderDetails(order);

    } catch (error) {
        console.error("Error loading order details:", error);
        container.innerHTML = `
      <div class="empty-state">
        <h3>Failed to load order</h3>
        <p>${error.message}</p>
        <a href="dashboard.html" class="btn-apple" style="margin-top:16px;">Back to Dashboard</a>
      </div>`;
    }
}

/* =========================
   RENDER ORDER DETAILS (FULL)
========================= */
function renderOrderDetails(order) {
    const shipping = order.shipping || {};
    const date = new Date(order.createdAt).toLocaleString();
    const isDelivered = order.status === 'Delivered';

    const itemsHTML = order.items.map(item => `
    <div class="order-item-row">
      <div class="order-item-name">${item.name}</div>
      <div class="order-item-qty">×${item.qty}</div>
      <div class="order-item-price">RS${(item.price * item.qty).toFixed(2)}</div>
    </div>
  `).join('');

    const statusButtons = !isDelivered ? `
  <div class="status-actions">
  <button class="btn-outline" onclick="history.back()">Cancel</button>
  ${order.status === 'Ready' ? `
    <button class="btn-apple" onclick="updateStatus('${order._id}', 'Picked Up')">
    Mark as Picked Up
    </button>
    ` : order.status === 'Picked Up' ? `
    <button class="btn-apple" onclick="updateStatus('${order._id}', 'Out for Delivery')">
    Out for Delivery
    </button>
    ` : `
    <button class="btn-apple" onclick="updateStatus('${order._id}', 'Delivered')">
    Mark as Delivered
    </button>
    `}
    </div>
    ` : `
    <div style="text-align:center;margin-top:24px;">
    <button class="btn-outline" onclick="history.back()">Back</button>
    </div>
    `;

    return `
    <h2 class="section-title">${order.orderId}</h2>
    
    <div class="order-details-card">
    <div class="order-section">
    <div class="order-section-title">Order Information</div>
    <p style="color:var(--apple-gray);margin-bottom:8px;">Placed on: ${date}</p>
    <p style="color:var(--apple-gray);">Status: <span class="badge badge-info">${order.status}</span></p>
    </div>
    
    <div class="order-section">
    <div class="order-section-title">Items</div>
    <div class="order-items-list">
    ${itemsHTML}
    </div>
    </div>
    
    <div class="order-section">
    <div class="order-section-title">Delivery Address</div>
    <div class="shipping-info">
    <div class="shipping-row">
    <div class="shipping-label">Customer:</div>
    <div class="shipping-value">${shipping.name || 'N/A'}</div>
    </div>
    <div class="shipping-row">
    <div class="shipping-label">Phone:</div>
    <div class="shipping-value">${shipping.phone || 'N/A'}</div>
    </div>
    <div class="shipping-row">
    <div class="shipping-label">Address:</div>
    <div class="shipping-value">
    ${shipping.addr1 || 'N/A'}${shipping.addr2 ? '<br>' + shipping.addr2 : ''}<br>
    ${shipping.city || ''}, ${shipping.postal || ''}
    </div>
    </div>
    ${shipping.notes ? `
        <div class="shipping-row">
        <div class="shipping-label">Notes:</div>
        <div class="shipping-value">${shipping.notes}</div>
        </div>
        ` : ''}
        </div>
        </div>
                
        <div class="order-section">
        <div class="order-total-section">
        <span>Total</span>
        <span>RS${order.total.toFixed(2)}</span>
        </div>
        </div>
        
        ${statusButtons}
        </div>
        `;
}

/* =========================
   UPDATE ORDER STATUS
========================= */
window.updateStatus = async function (orderId, newStatus) {
    if (!confirm(`Mark this order as "${newStatus}"?`)) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:5001/api/delivery/order/${orderId}/status`, {
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

        showToast(`Order updated to ${newStatus}`);

        // Reload current page
        setTimeout(() => {
            if (document.querySelector("#orderDetailsContainer")) {
                loadOrderDetails();
            } else {
                window.location.reload();
            }
        }, 500);

    } catch (error) {
        console.error("Error updating status:", error);
        alert(error.message || "Failed to update order");
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