// Inventory Panel JavaScript - Unified Product + Stock Management

// Protect this page
if (typeof requireRole === 'function') {
  requireRole('inventory', 'manager', 'admin');
}

document.addEventListener("DOMContentLoaded", () => {
  const addProductForm = document.querySelector("#addProductForm");
  const productsTableBody = document.querySelector("#productsBody");

  if (addProductForm) addProductForm.addEventListener("submit", handleAddProduct);
  if (productsTableBody) loadProducts();

  // Update stats on dashboard
  if (document.querySelector("#totalItems")) updateStats();
});

// Init Add Product image upload
document.addEventListener("DOMContentLoaded", () => {
  setupImageUpload(
    '#addProductImageContainer',
    '#productImage',
    '#addImagePreview'
  );
});

/* =========================
   LOAD PRODUCTS WITH STOCK
========================= */
async function loadProducts() {
  const tableBody = document.querySelector("#productsBody");
  if (!tableBody) return;

  try {
    const products = await API.getStock();

    if (!products.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;color:var(--apple-gray);padding:40px;">
            No products yet. Add your first product above.
          </td>
        </tr>`;
      return;
    }

    tableBody.innerHTML = products.map(item => {
      const stock = item.stock || {};
      const expiryDate = stock.expiry ? new Date(stock.expiry) : null;
      const isExpiringSoon = expiryDate ? (expiryDate - new Date()) < 7 * 24 * 60 * 60 * 1000 : false;

      let statusClass = 'badge-success';
      if (stock.status === 'Low Stock') statusClass = 'badge-warning';
      if (stock.status === 'Out of Stock') statusClass = 'badge-danger';

      return `
        <tr data-id="${item._id}">
          <td>
            <div style="display:flex;align-items:center;gap:12px;">
              ${item.image ? `
                <img src="${item.image}" alt="${item.name}" 
                     style="width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid var(--border);">
              ` : `
                <div style="width:48px;height:48px;background:linear-gradient(135deg, var(--apple-blue), var(--apple-hover));border-radius:8px;display:flex;align-items:center;justify-content:center;">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:24px;height:24px;fill:white;">
                    <path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm5.5 7h-11c-.8 0-1.5.7-1.5 1.5v1c0 2.2 1.8 4 4 4h4c2.2 0 4-1.8 4-4v-1c0-.8-.7-1.5-1.5-1.5zM9 16c-.6 0-1 .4-1 1v5c0 .6.4 1 1 1h6c.6 0 1-.4 1-1v-5c0-.6-.4-1-1-1H9z"/>
                  </svg>
                </div>
              `}
              <span>${item.name}</span>
            </div>
          </td>
          <td>RS${item.price.toFixed(2)}</td>
          <td>${item.description || 'No description'}</td>
          <td>${stock.quantity || 0} ${stock.unit || 'pcs'}</td>
          <td class="${isExpiringSoon ? 'text-danger' : ''}">
            ${expiryDate ? expiryDate.toLocaleDateString() : 'N/A'}
          </td>
          <td>
            <span class="badge ${statusClass}">${stock.status || 'No Stock'}</span>
          </td>
          <td>
            <button class="btn-apple" style="padding:6px 16px;font-size:0.85rem;margin-right:8px;" 
                    onclick='openProductEditModal(${JSON.stringify(item)}, ${JSON.stringify(stock)})'>
              Edit
            </button>
            <button class="btn-delete" onclick="handleDelete('${item._id}', '${item.name}')">
              Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error("Error loading products:", error);
    alert("Failed to load products. Please refresh the page.");
  }
}

// ADD PRODUCT + STOCK
async function handleAddProduct(e) {
  e.preventDefault();

  const nameEl = document.querySelector("#productName");
  const priceEl = document.querySelector("#price");
  const descEl = document.querySelector("#description");
  const categoryEl = document.querySelector("#category");
  const quantityEl = document.querySelector("#quantity");
  const unitEl = document.querySelector("#unit");
  const expiryEl = document.querySelector("#expiryDate");
  const imageEl = document.querySelector("#productImage");
  const successAlert = document.querySelector("#successAlert");

  // Check if elements exist
  if (!nameEl || !priceEl || !quantityEl) {
    alert("Form configuration error");
    return;
  }

  // Reset validation
  [nameEl, priceEl, quantityEl].forEach(el => el.classList.remove("is-invalid"));
  if (successAlert) {
    successAlert.style.display = "none";
    successAlert.classList.add("d-none");
  }

  // Validate
  let valid = true;

  // Validate product name: only letters and spaces
  if (!/^[A-Za-z\s]+$/.test(nameEl.value.trim())) {
    nameEl.classList.add("is-invalid");
    alert("Product name must only contain letters and spaces.");
    valid = false;
  }

  // Validate other fields
  if (!nameEl.value.trim()) {
    nameEl.classList.add("is-invalid");
    valid = false;
  }
  if (!priceEl.value || priceEl.value < 0) {
    priceEl.classList.add("is-invalid");
    valid = false;
  }
  if (!quantityEl.value || quantityEl.value < 0) {
    quantityEl.classList.add("is-invalid");
    valid = false;
  }

  if (!valid) {
    alert("Please fill all required fields correctly");
    return;
  }

  try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('name', nameEl.value.trim());
    formData.append('price', priceEl.value);
    formData.append('description', descEl ? descEl.value.trim() : '');
    formData.append('category', categoryEl ? categoryEl.value : 'Dessert');
    formData.append('quantity', quantityEl.value);
    formData.append('unit', unitEl ? unitEl.value : 'pcs');
    formData.append('expiry', expiryEl ? expiryEl.value : '');

    // Add image if selected
    if (imageEl && imageEl.files && imageEl.files[0]) {
      console.log('Adding image to form:', imageEl.files[0].name);
      formData.append('image', imageEl.files[0]);
    }

    // Submit to API
    const response = await fetch('http://localhost:5001/api/inventory', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
        // DO NOT set Content-Type - browser sets it automatically with boundary for multipart/form-data
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add product');
    }

    const data = await response.json();
    console.log('Product added successfully:', data);

    // Reset form
    e.target.reset();

    // Reset image preview
    const preview = document.querySelector('#addImagePreview');
    const imageInput = document.querySelector('#productImage');
    const icon = document.querySelector('.product-image-icon');
    const container = document.querySelector('#addProductImageContainer');

    if (preview) {
      preview.src = '';
      preview.style.display = 'none';
    }
    if (imageInput) imageInput.value = '';
    if (icon) icon.style.display = 'flex';
    if (container) container.classList.remove('has-image');

    // Show success alert
    if (successAlert) {
      successAlert.textContent = `${data.name} has been added successfully!`;
      successAlert.style.display = "block";
      successAlert.classList.remove("d-none");
      setTimeout(() => {
        successAlert.style.display = "none";
        successAlert.classList.add("d-none");
      }, 3000);
    }

    // Reload if on products page
    if (document.querySelector("#productsBody")) {
      loadProducts();
      updateStats();
    }

  } catch (error) {
    console.error("Error adding product:", error);
    alert(error.message || "Failed to add product");
  }
}

function setupImageUpload(containerId, inputId, previewId) {
  const container = document.querySelector(containerId);
  const input = document.querySelector(inputId);
  const preview = document.querySelector(previewId);
  const icon = container.querySelector('.product-image-icon');

  if (!container || !input || !preview || !icon) return;

  container.addEventListener('click', () => input.click());

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.style.display = 'block';
      icon.style.display = 'none';
      container.classList.add('has-image');
    };
    reader.readAsDataURL(file);
  });

  container.addEventListener('dragover', e => {
    e.preventDefault();
    container.classList.add('dragover');
  });

  container.addEventListener('dragleave', () => {
    container.classList.remove('dragover');
  });

  container.addEventListener('drop', e => {
    e.preventDefault();
    container.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
  });
}

function removeImagePreview() {
  const input = document.getElementById('productImage');
  const preview = document.getElementById('addImagePreview');
  const icon = document.querySelector('.product-image-icon');

  if (input) input.value = '';
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
  if (icon) {
    icon.style.display = 'flex';
  }
}

/* =========================
   DELETE PRODUCT
========================= */
async function handleDelete(id, name) {
  if (!confirm(`Delete "${name}" and all its stock data?`)) {
    return;
  }

  try {
    await API.deleteStock(id);

    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (row) {
      row.style.backgroundColor = '#ffebee';
      setTimeout(() => {
        loadProducts();
        updateStats();
      }, 300);
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    alert(error.message || "Failed to delete product");
  }
}

/* =========================
   UPDATE DASHBOARD STATS
========================= */
async function updateStats() {
  try {
    const products = await API.getStock();

    const totalItems = products.length;
    const lowStock = products.filter(p => p.stock && p.stock.status === 'Low Stock').length;
    const outOfStock = products.filter(p => p.stock && p.stock.status === 'Out of Stock').length;

    const totalItemsEl = document.querySelector("#totalItems");
    const lowStockEl = document.querySelector("#lowStock");
    const outOfStockEl = document.querySelector("#outOfStock");

    if (totalItemsEl) totalItemsEl.textContent = totalItems;
    if (lowStockEl) lowStockEl.textContent = lowStock;
    if (outOfStockEl) outOfStockEl.textContent = outOfStock;

  } catch (error) {
    console.error("Error updating stats:", error);
  }
}

// Handle dropped file
function handleDroppedFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please drop an image file');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Image size must be less than 5MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('productImageDisplay').src = e.target.result;
    document.getElementById('productImageDisplay').style.display = 'block';
    document.querySelector('.product-image-icon').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// Remove the product image
function removeProductImage(event) {
  if (event) event.stopPropagation();

  const confirmed = confirm("Remove product image?");
  if (!confirmed) return;

  selectedImageFile = null;
  shouldRemoveImage = true;

  const input = document.querySelector('#productImageInput');
  const preview = document.querySelector('#productImageDisplay');
  const iconLarge = document.querySelector('.product-image-icon-large');

  if (input) input.value = '';
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
  if (iconLarge) iconLarge.style.display = 'flex';

  const container = document.querySelector('#productImageContainer');
  if (container) container.classList.remove('has-image');
}


/* =========================
   EXPOSE FUNCTIONS GLOBALLY
========================= */
window.handleDelete = handleDelete;
