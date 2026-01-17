// Cashier Panel JavaScript - Part 1

// Protect this page
if (typeof requireRole === 'function') {
    requireRole('cashier', 'manager', 'admin');
}

let currentCustomer = null;
let cart = [];
let currentTab = 'search';

document.addEventListener("DOMContentLoaded", () => {
    // Dashboard - nothing to load

    // Customer Profile page
    if (document.querySelector("#customerProfile")) {
        loadCustomerProfile();
    }

    // Checkout page
    if (document.querySelector("#productsGrid")) {
        loadCheckoutPage();
    }

    // Receipt page
    if (document.querySelector("#receiptContainer")) {
        loadReceipt();
    }

    // History page
    if (document.querySelector("#historyGrid")) {
        loadOrderHistory();
    }
});

/* =========================
   CUSTOMER MODAL
========================= */
window.openCustomerModal = function () {
    document.querySelector("#customerModal").style.display = "flex";
    currentTab = 'search';
    document.querySelector("#customerSearch").focus();
};

window.closeCustomerModal = function () {
    document.querySelector("#customerModal").style.display = "none";
    document.querySelector("#customerSearch").value = "";
    document.querySelector("#searchResults").innerHTML = "";
};

window.switchTab = function (tab) {
    currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.modal-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Show/hide content
    if (tab === 'search') {
        document.querySelector("#searchTab").style.display = "block";
        document.querySelector("#addTab").style.display = "none";
    } else {
        document.querySelector("#searchTab").style.display = "none";
        document.querySelector("#addTab").style.display = "block";
    }
};

/* =========================
   SEARCH CUSTOMERS
========================= */
let searchTimeout;
window.searchCustomers = async function () {
    const query = document.querySelector("#customerSearch").value.trim();
    const resultsContainer = document.querySelector("#searchResults");

    if (query.length < 2) {
        resultsContainer.innerHTML = "";
        return;
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/cashier/customers/search?query=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const customers = await response.json();

            if (!customers.length) {
                resultsContainer.innerHTML = `<p style="text-align:center;color:var(--apple-gray);padding:20px;">No customers found</p>`;
                return;
            }

            resultsContainer.innerHTML = customers.map(customer => `
        <div class="customer-result" onclick='selectCustomer(${JSON.stringify(customer)})'>
          <div class="customer-name">${customer.name}</div>
          <div class="customer-email">${customer.email}</div>
        </div>
      `).join('');

        } catch (error) {
            console.error("Search error:", error);
        }
    }, 300);
};

window.selectCustomer = function (customer) {
    currentCustomer = customer;
    localStorage.setItem('currentCustomer', JSON.stringify(customer));
    closeCustomerModal();
    window.location.href = `customer.html?id=${customer._id}`;
};

/* =========================
   ADD NEW CUSTOMER
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const addForm = document.querySelector("#addCustomerForm");
    if (addForm) {
        addForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Get all form values
            const name = document.querySelector("#customerName").value.trim();
            const email = document.querySelector("#customerEmail").value.trim();
            const password = document.querySelector("#customerPassword").value;
            const confirmPassword = document.querySelector("#customerConfirmPassword").value;
            const phone = document.querySelector("#customerPhone")?.value.trim() || '';
            const addr1 = document.querySelector("#customerAddr1")?.value.trim() || '';
            const addr2 = document.querySelector("#customerAddr2")?.value.trim() || '';
            const city = document.querySelector("#customerCity")?.value.trim() || '';
            const postal = document.querySelector("#customerPostal")?.value.trim() || '';

            // Validate password
            if (!validatePassword(password)) {
                alert('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
                return;
            }

            // Validate password match
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            try {
                const response = await fetch('http://localhost:5001/api/cashier/customer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        phone,
                        address: {
                            addr1,
                            addr2,
                            city,
                            postal
                        }
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message);
                }

                // Clear form
                e.target.reset();

                // Show success message
                alert(`Customer account created successfully for ${name}!`);

                // Select the customer
                selectCustomer(data.customer);

            } catch (error) {
                alert(error.message || "Failed to add customer");
            }
        });
    }
});

// Password validation function (same as signup)
function validatePassword(password) {
    const minLength = /.{8,}/;
    const uppercase = /[A-Z]/;
    const lowercase = /[a-z]/;
    const number = /[0-9]/;
    const special = /[!@#$%^&*(),.?":{}|<>]/;
    return (
        minLength.test(password) &&
        uppercase.test(password) &&
        lowercase.test(password) &&
        number.test(password) &&
        special.test(password)
    );
}

/* =========================
   CUSTOMER PROFILE PAGE
========================= */
async function loadCustomerProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('id');

    if (!customerId) {
        window.location.href = 'dashboard.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:5001/api/cashier/customer/${customerId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();

        currentCustomer = data.customer;
        localStorage.setItem('currentCustomer', JSON.stringify(currentCustomer));

        // Render profile
        const profileContainer = document.querySelector("#customerProfile");
        profileContainer.innerHTML = `
      <div class="customer-header">
        <div class="customer-avatar">${data.customer.name.charAt(0).toUpperCase()}</div>
        <div class="customer-info">
          <h2>${data.customer.name}</h2>
          <p>${data.customer.email}</p>
        </div>
        <div class="customer-actions">
          <button class="btn-apple" onclick="startNewOrder()">New Order</button>
          <button class="btn-outline" onclick="window.location.href='dashboard.html'">Back</button>
        </div>
      </div>
    `;

        // Render orders
        displayOrders(data.orders);

    } catch (error) {
        console.error("Load customer error:", error);
        alert("Failed to load customer");
        window.location.href = 'dashboard.html';
    }
}

window.switchOrdersTab = function (tab) {
    // Just visual - all orders already loaded
    document.querySelectorAll('.orders-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
};

function displayOrders(orders) {
    const container = document.querySelector("#ordersContainer");

    if (!orders.length) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <h3>No orders yet</h3>
        <p>This customer hasn't placed any orders</p>
      </div>`;
        return;
    }

    container.innerHTML = `
    <div class="history-grid">
      ${orders.map(order => `
        <div class="history-card">
          <div class="history-header">
            <div class="history-id">${order.orderId}</div>
            <span class="badge badge-info">${order.status}</span>
          </div>
          <div class="history-details">
            <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
            <div><strong>Items:</strong> ${order.items.length}</div>
            <div><strong>Total:</strong> RS${order.total.toFixed(2)}</div>
            <div><strong>Payment:</strong> ${order.paymentCollected ? '✓ Paid' : '✗ Pending'}</div>
          </div>
        </div>
      `).join('')}
    </div>`;
}

window.startNewOrder = function () {
    window.location.href = 'checkout.html';
};

/* =========================
   CHECKOUT PAGE
========================= */
async function loadCheckoutPage() {
    const customerData = localStorage.getItem('currentCustomer');
    if (!customerData) {
        alert('No customer selected');
        window.location.href = 'dashboard.html';
        return;
    }

    currentCustomer = JSON.parse(customerData);

    // Display customer info
    document.querySelector("#customerInfo").textContent =
        `Order for: ${currentCustomer.name} (${currentCustomer.email})`;

    // Load products
    try {
        const response = await fetch('http://localhost:5001/api/cashier/products', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const products = await response.json();

        const grid = document.querySelector("#productsGrid");
        grid.innerHTML = products.map(product => `
      <div class="product-card" onclick='addToCart(${JSON.stringify(product)})'>
        <div class="product-name">${product.name}</div>
        <div class="product-price">RS${product.price.toFixed(2)}</div>
        <div class="product-stock">Stock: ${product.stock}</div>
      </div>
    `).join('');

    } catch (error) {
        console.error("Load products error:", error);
    }
}

window.addToCart = function (product) {
    const existing = cart.find(item => item._id === product._id);

    if (existing) {
        if (existing.qty >= product.stock) {
            alert('Insufficient stock');
            return;
        }
        existing.qty++;
    } else {
        cart.push({
            _id: product._id,
            name: product.name,
            price: product.price,
            qty: 1,
            stock: product.stock
        });
    }

    updateCart();
};

function updateCart() {
    const container = document.querySelector("#cartItems");
    const totalEl = document.querySelector("#totalAmount");
    const cartTotalSection = document.querySelector("#cartTotal");
    const paymentSection = document.querySelector("#paymentSection");
    const completeBtn = document.querySelector("#completeBtn");

    if (!cart.length) {
        container.innerHTML = `
      <div class="empty-state" style="padding:40px 20px;">
        <p style="font-size:0.9rem;">Cart is empty</p>
      </div>`;
        cartTotalSection.style.display = 'none';
        paymentSection.style.display = 'none';
        completeBtn.style.display = 'none';
        return;
    }

    container.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">RS${item.price.toFixed(2)} × ${item.qty}</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="updateQty(${index}, -1)">−</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
      </div>
      <span style="font-weight:600;">RS${(item.price * item.qty).toFixed(2)}</span>
    </div>
  `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    totalEl.textContent = `RS${total.toFixed(2)}`;

    cartTotalSection.style.display = 'block';
    paymentSection.style.display = 'flex';
    completeBtn.style.display = 'block';
}

window.updateQty = function (index, change) {
    const item = cart[index];
    item.qty += change;

    if (item.qty <= 0) {
        cart.splice(index, 1);
    } else if (item.qty > item.stock) {
        alert('Insufficient stock');
        item.qty = item.stock;
    }

    updateCart();
};

window.completeOrder = async function () {
    if (!cart.length) {
        alert('Cart is empty');
        return;
    }

    const paymentCollected = document.querySelector("#paymentCollected").checked;
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    try {
        const response = await fetch('http://localhost:5001/api/cashier/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                customerId: currentCustomer._id,
                items: cart.map(item => ({
                    productId: item._id,
                    name: item.name,
                    price: item.price,
                    qty: item.qty
                })),
                total,
                paymentCollected
            })
        });

        const order = await response.json();

        if (!response.ok) {
            throw new Error(order.message);
        }

        // Save order for receipt
        localStorage.setItem('lastOrder', JSON.stringify(order));
        cart = [];

        // Redirect to receipt
        window.location.href = 'receipt.html';

    } catch (error) {
        alert(error.message || 'Failed to complete order');
    }
};

// Cashier Panel JavaScript - Part 2 (ADD THIS TO PART 1)

/* =========================
   RECEIPT PAGE
========================= */
function loadReceipt() {
    const orderData = localStorage.getItem('lastOrder');
    const customerData = localStorage.getItem('currentCustomer');

    if (!orderData || !customerData) {
        window.location.href = 'dashboard.html';
        return;
    }

    const order = JSON.parse(orderData);
    const customer = JSON.parse(customerData);
    const date = new Date(order.createdAt).toLocaleString();

    const container = document.querySelector("#receiptContainer");
    container.innerHTML = `
    <div class="receipt-card">
      <div class="receipt-header">
        <div class="receipt-logo">SweetBite</div>
        <p style="color:var(--apple-gray);">Thank you for your order!</p>
      </div>

      <div class="receipt-section">
        <div class="receipt-section-title">Order Information</div>
        <p><strong>Order ID:</strong> ${order.orderId}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Customer:</strong> ${customer.name}</p>
        <p><strong>Email:</strong> ${customer.email}</p>
        <p><strong>Payment:</strong> ${order.paymentCollected ? '✓ Collected' : '✗ Pending'}</p>
      </div>

      <div class="receipt-section">
        <div class="receipt-section-title">Items</div>
        <div class="receipt-items">
          ${order.items.map(item => `
            <div class="receipt-item">
              <span>${item.name} × ${item.qty}</span>
              <span>RS${(item.price * item.qty).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="receipt-total">
        <span>Total</span>
        <span>RS${order.total.toFixed(2)}</span>
      </div>

      <div class="receipt-actions">
        <button class="btn-outline" onclick="window.print()">Print Receipt</button>
        <button class="btn-apple" onclick="finishOrder()">New Order</button>
      </div>
    </div>
  `;
}

window.finishOrder = function () {
    localStorage.removeItem('lastOrder');
    localStorage.removeItem('currentCustomer');
    window.location.href = 'dashboard.html';
};

/* =========================
   ORDER HISTORY
========================= */
async function loadOrderHistory() {
    const container = document.querySelector("#historyGrid");

    try {
        const response = await fetch('http://localhost:5001/api/cashier/orders', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const orders = await response.json();

        if (!orders.length) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📜</div>
          <h3>No orders yet</h3>
          <p>Orders will appear here once processed</p>
        </div>`;
            return;
        }

        container.innerHTML = orders.map(order => `
      <div class="history-card">
        <div class="history-header">
          <div>
            <div class="history-id">${order.orderId}</div>
            <p style="color:var(--apple-gray);font-size:0.85rem;margin-top:4px;">
              ${order.customerId ? order.customerId.name : 'Guest'}
            </p>
          </div>
          <span class="badge badge-info">${order.status}</span>
        </div>
        <div class="history-details">
          <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
          <div><strong>Items:</strong> ${order.items.length}</div>
          <div><strong>Total:</strong> RS${order.total.toFixed(2)}</div>
          <div><strong>Payment:</strong> ${order.paymentCollected ? '✓ Paid' : '✗ Pending'}</div>
        </div>
      </div>
    `).join('');

    } catch (error) {
        console.error("Load history error:", error);
        container.innerHTML = `
      <div class="empty-state">
        <h3>Failed to load orders</h3>
        <p>${error.message}</p>
      </div>`;
    }
}