// Customer Panel JavaScript - Backend Integrated

document.addEventListener("DOMContentLoaded", () => {
  const checkoutForm = document.querySelector("#checkoutForm");

  if (checkoutForm) checkoutForm.addEventListener("submit", handlePlaceOrder);

  if (document.querySelector("#menuContainer")) renderMenu();
  if (document.querySelector("#cartItems")) loadCart();
  if (document.querySelector("#checkoutSummary")) renderCheckoutSummary();
  if (document.querySelector("#ordersList")) renderOrders();
  if (document.querySelector("#featuredGrid")) loadFeaturedProducts();

  updateTotal();
});

// Featured Products on Dashboard

async function loadFeaturedProducts() {
  const container = document.querySelector('#featuredGrid');
  if (!container) return;

  try {
    const response = await fetch('http://localhost:5001/api/customer/featured');
    const products = await response.json();


    if (!products.length) {
      container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--apple-gray);">
          <p style="font-size:1.2rem;margin-bottom:16px;">No featured products yet</p>
          <p>Check back soon for delicious treats!</p>
        </div>`;
      return;
    }

    container.innerHTML = products.slice(0, 3).map(product => `
      <div class="feature-card">
        <div class="menu-item-image-placeholder">
          ${product.image
                ? `<img src="${product.image}" alt="${product.name}" />`
                : `
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm5.5 7h-11c-.8 0-1.5.7-1.5 1.5v1c0 2.2 1.8 4 4 4h4c2.2 0 4-1.8 4-4v-1c0-.8-.7-1.5-1.5-1.5zM9 16c-.6 0-1 .4-1 1v5c0 .6.4 1 1 1h6c.6 0 1-.4 1-1v-5c0-.6-.4-1-1-1H9z"/>
                </svg>
              `
              }
        </div>
        <div class="feature-content">
          <h3 class="feature-title">${product.name}</h3>
          <p class="feature-description">${product.description || 'Delicious dessert'}</p>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading featured products:', error);
  }
}

// Menu - Load from Backend
async function renderMenu() {
  const container = document.querySelector("#menuContainer");
  if (!container) return;

  try {
    const products = await API.getProducts();

    if (!products.length) {
      console.log("❌ No products returned from API");
      container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--apple-gray);">
          <p style="font-size:1.2rem;margin-bottom:16px;">No products available yet</p>
          <p>Check back soon for delicious treats!</p>
        </div>`;
      return;
    }

    container.innerHTML = products.map((item) => `
      <div class="menu-item">
        <div class="menu-item-image">
        ${item.image
        ? `<img src="${item.image}" alt="${item.name}" />`
        : `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm5.5 7h-11c-.8 0-1.5.7-1.5 1.5v1c0 2.2 1.8 4 4 4h4c2.2 0 4-1.8 4-4v-1c0-.8-.7-1.5-1.5-1.5zM9 16c-.6 0-1 .4-1 1v5c0 .6.4 1 1 1h6c.6 0 1-.4 1-1v-5c0-.6-.4-1-1-1H9z"/>
              </svg>`
      }
        </div>

        <div class="menu-item-content">
          <div class="menu-item-name">${item.name}</div>
          ${item.description ? `<p style="font-size:0.85rem;color:var(--apple-gray);margin:8px 0;">${item.description}</p>` : ''}
          <div class="menu-item-price">RS${item.price.toFixed(2)}</div>
          <button class="btn-apple" style="width:100%;" 
                  onclick='addToCart(${JSON.stringify({
        _id: item._id,
        name: item.name,
        price: item.price
      })})'>
            Add to Cart
          </button>
        </div>
      </div>
    `).join("");
  } catch (error) {
    console.error("❌ Error loading menu:", error);
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#c62828;">
        <p>Failed to load menu. Please refresh the page.</p>
        <p style="font-size:0.85rem;margin-top:8px;">Error: ${error.message}</p>
      </div>`;
  }
}

// Cart Management
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateTotal();
}

window.addToCart = function (item) {
  const existing = cart.find((i) => i._id === item._id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  saveCart();
  showToast(`${item.name} added to cart`);
  if (document.querySelector("#cartItems")) loadCart();
};

window.removeFromCart = function (id) {
  cart = cart.filter((i) => i._id !== id);
  saveCart();
  loadCart();
  showToast("Item removed");
};

window.updateQty = function (id, change) {
  const item = cart.find((i) => i._id === id);
  if (!item) return;
  item.qty += change;
  if (item.qty <= 0) {
    removeFromCart(id);
  } else {
    saveCart();
    loadCart();
  }
};

function loadCart() {
  const container = document.querySelector("#cartItems");
  if (!container) return;

  if (!cart.length) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Your cart is empty</p>
        <a href="menu.html" class="btn-apple" style="margin-top:16px;">Browse Menu</a>
      </div>`;
    updateTotal();
    return;
  }

  container.innerHTML = cart.map((item) => `
      <div class="cart-item">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="updateQty('${item._id}', -1)">−</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty('${item._id}', 1)">+</button>
        </div>
        <div class="cart-item-price">RS${(item.price * item.qty).toFixed(2)}</div>
        <button class="remove-btn" onclick="removeFromCart('${item._id}')">×</button>
      </div>
    `).join("");
  updateTotal();
}

function updateTotal() {
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalEl = document.querySelector("#cartTotal");
  if (totalEl) totalEl.textContent = `RS${total.toFixed(2)}`;
}

// Checkout
function renderCheckoutSummary() {
  const summaryEl = document.querySelector("#checkoutSummary");
  const totalEl = document.querySelector("#checkoutTotal");
  const shippingSelect = document.querySelector("#shippingMethod");

  if (!summaryEl || !totalEl) return;

  if (!cart.length) {
    summaryEl.innerHTML = `<div style="color:var(--apple-gray);text-align:center;">Cart is empty. <a href="menu.html" style="color:var(--apple-blue);">Go to menu</a></div>`;
    totalEl.textContent = `RS0.00`;
    return;
  }

  let html = '<div class="summary-items">';
  cart.forEach((i) => {
    html += `<div class="summary-item">
      <span class="summary-item-name">${i.name} ×${i.qty}</span>
      <span class="summary-item-price">RS${(i.price * i.qty).toFixed(2)}</span>
    </div>`;
  });
  html += "</div>";
  summaryEl.innerHTML = html;

  let total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingMethod = shippingSelect ? shippingSelect.value : "standard";
  if (shippingMethod === "express") total += 3.99;
  totalEl.textContent = `RS${total.toFixed(2)}`;

  if (shippingSelect) {
    shippingSelect.onchange = () => renderCheckoutSummary();
  }
}

// Place Order (BACKEND)
async function handlePlaceOrder(e) {
  e.preventDefault();

  const name = (document.querySelector("#fullName")?.value || "").trim();
  const phone = (document.querySelector("#phone")?.value || "").trim();
  const addr1 = (document.querySelector("#addressLine1")?.value || "").trim();
  const addr2 = (document.querySelector("#addressLine2")?.value || "").trim();
  const city = (document.querySelector("#city")?.value || "").trim();
  const postal = (document.querySelector("#postal")?.value || "").trim();
  const shipping = document.querySelector("#shippingMethod")?.value || "standard";
  const notes = (document.querySelector("#notes")?.value || "").trim();

  ["fullName", "phone", "addressLine1", "city", "postal"].forEach(id => {
    document.querySelector(`#${id}`)?.classList.remove("is-invalid");
  });

  let valid = true;
  if (!name) {
    document.querySelector("#fullName").classList.add("is-invalid");
    valid = false;
  }
  if (!phone || !/^\+?[0-9\s\-]{7,15}$/.test(phone)) {
    document.querySelector("#phone").classList.add("is-invalid");
    valid = false;
  }
  if (!addr1) {
    document.querySelector("#addressLine1").classList.add("is-invalid");
    valid = false;
  }
  if (!city) {
    document.querySelector("#city").classList.add("is-invalid");
    valid = false;
  }
  if (!postal) {
    document.querySelector("#postal").classList.add("is-invalid");
    valid = false;
  }

  if (!valid) {
    showToast("Please fill required shipping details");
    return;
  }

  if (!cart.length) {
    showToast("Your cart is empty");
    return;
  }

  let total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  if (shipping === "express") total += 3.99;

  try {
    const orderData = {
      items: cart.map((i) => ({
        productId: i._id,
        name: i.name,
        price: i.price,
        qty: i.qty
      })),
      shipping: { name, phone, addr1, addr2, city, postal, shipping, notes },
      total: parseFloat(total.toFixed(2))
    };

    await API.createOrder(orderData);
    cart = [];
    saveCart();
    showToast("Order placed successfully!");
    setTimeout(() => (window.location.href = "orders.html"), 900);
  } catch (error) {
    showToast(error.message || "Failed to place order");
  }
}

// Orders (BACKEND)
async function renderOrders() {
  const listEl = document.querySelector("#ordersList");
  if (!listEl) return;

  try {
    const orders = await API.getOrders();

    if (!orders.length) {
      listEl.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">📦</div>
          <p>No orders yet</p>
          <a href="menu.html" class="btn-apple" style="margin-top:16px;">Start Shopping</a>
        </div>`;
      return;
    }

    listEl.innerHTML = orders.map((order) => {
      const date = new Date(order.createdAt).toLocaleString();
      const itemsText = order.items.map((i) => `${i.name} ×${i.qty}`).join(", ");

      let badgeClass = "badge-warning";
      if (order.status === "Delivered") badgeClass = "badge-success";
      else if (order.status === "Ready" || order.status === "Out for Delivery") badgeClass = "badge-info";

      return `
        <div class="order-card">
          <div class="order-header">
            <div class="order-id">${order.orderId}</div>
            <div class="order-date">${date}</div>
          </div>
          <div class="order-items">${itemsText}</div>
          <div class="order-footer">
            <div class="order-total">RS${order.total.toFixed(2)}</div>
            <span class="badge ${badgeClass}">${order.status}</span>
          </div>
        </div>`;
    }).join("");
  } catch (error) {
    console.error("Error loading orders:", error);
    showToast("Error loading orders");
  }
}

// Toast
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-popup";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}