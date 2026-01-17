// Product Edit Modal - Fixed Version with Image Upload

let currentEditProduct = null;
let currentEditStock = null;
let selectedImageFile = null;
let shouldRemoveImage = false;

// Initialize modal
document.addEventListener('DOMContentLoaded', () => {
  createEditModal();
  setupModalEventListeners();
});

// ===== ADD PRODUCT IMAGE HANDLING =====
const addImageInput = document.getElementById('addProductImageInput');
const preview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');

if (addImageInput) {
  addImageInput.addEventListener('change', () => {
    const file = addImageInput.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image');
      addImageInput.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      addImageInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
}

// Remove preview image
function removeImagePreview() {
  document.getElementById('addProductImageInput').value = '';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('previewImg').src = '';
}

// Create modal HTML
function createEditModal() {
  const modalHTML = `
    <div id="productEditOverlay" class="product-edit-overlay">
      <div class="product-edit-modal">
        <div class="modal-header">
          <h3 class="modal-title" id="editModalTitle">Edit Product</h3>
          <button class="close-modal-btn" onclick="closeProductEditModal()">×</button>
        </div>

        <!-- Image Upload Section -->
        <div class="image-upload-section">
          <div class="product-image-container-large" id="productImageContainer">
            <div class="product-image-icon-large editing" id="productImageIcon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm5.5 7h-11c-.8 0-1.5.7-1.5 1.5v1c0 2.2 1.8 4 4 4h4c2.2 0 4-1.8 4-4v-1c0-.8-.7-1.5-1.5-1.5zM9 16c-.6 0-1 .4-1 1v5c0 .6.4 1 1 1h6c.6 0 1-.4 1-1v-5c0-.6-.4-1-1-1H9z"/>
              </svg>
              <p class="upload-text">Click or drag image here</p>
            </div>
            <img id="productImageDisplay" class="product-image-display-large" style="display:none;">
            <div class="remove-image-overlay">
              <button type="button" class="remove-image-btn" onclick="removeProductImage(event)">×</button>
            </div>
          </div>
          <input type="file" id="productImageInput" class="image-file-input" accept="image/*" style="display:none;">
          <p class="upload-hint">PNG, JPG, WebP • Max 5MB • Drag & drop or click to upload</p>
        </div>

        <!-- Edit Form -->
        <form id="productEditForm">
          <div class="modal-form-grid">
            <div class="form-group full-width">
              <label class="form-label">Product Name</label>
              <input type="text" id="editProductName" class="form-control" required>
            </div>

            <div class="form-group">
              <label class="form-label">Price (RS)</label>
              <input type="number" id="editPrice" class="form-control" step="0.01" min="0" required>
            </div>

            <div class="form-group">
              <label class="form-label">Category</label>
              <select id="editCategory" class="form-control">
                <option value="Dessert">Dessert</option>
                <option value="Cake">Cake</option>
                <option value="Pastry">Pastry</option>
                <option value="Ice Cream">Ice Cream</option>
                <option value="Beverage">Beverage</option>
              </select>
            </div>

            <div class="form-group full-width">
              <label class="form-label">Description</label>
              <textarea id="editDescription" class="form-control" rows="3"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Quantity</label>
              <input type="number" id="editQuantity" class="form-control" min="0" required>
            </div>

            <div class="form-group">
              <label class="form-label">Unit</label>
              <select id="editUnit" class="form-control">
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="liters">Liters</option>
                <option value="packs">Packs</option>
              </select>
            </div>

            <div class="form-group full-width">
              <label class="form-label">Expiry Date (Optional)</label>
              <input type="date" id="editExpiry" class="form-control">
            </div>
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn-apple">Save Changes</button>
            <button type="button" class="btn-outline" onclick="closeProductEditModal()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (!document.querySelector('#productEditOverlay')) {
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
}

// Setup event listeners
function setupModalEventListeners() {
  const form = document.querySelector('#productEditForm');
  if (form) {
    form.addEventListener('submit', handleProductUpdate);
  }

  const overlay = document.querySelector('#productEditOverlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeProductEditModal();
      }
    });
  }

  // Image container interactions - Wait for modal to exist
  setTimeout(() => {
    const imageContainer = document.querySelector('#productImageContainer');
    const imageInput = document.querySelector('#productImageInput');

    if (imageContainer && imageInput) {
      // Click handler
      imageContainer.addEventListener('click', () => {
        imageInput.click();
      });

      // File change handler
      imageInput.addEventListener('change', handleImageSelect);

      // Drag and drop
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        imageContainer.addEventListener(eventName, preventDefaults, false);
      });

      function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
      }

      ['dragenter', 'dragover'].forEach(eventName => {
        imageContainer.addEventListener(eventName, () => {
          imageContainer.classList.add('drag-over');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        imageContainer.addEventListener(eventName, () => {
          imageContainer.classList.remove('drag-over');
        }, false);
      });

      imageContainer.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          handleDroppedFile(files[0]);
        }
      }, false);
    }
  }, 100);
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

  selectedImageFile = file;
  shouldRemoveImage = false;

  const reader = new FileReader();
  reader.onload = (e) => {
    updateImageDisplay(e.target.result);
  };
  reader.readAsDataURL(file);
}

// Open modal with product data
function openProductEditModal(product, stock) {
  currentEditProduct = product;
  currentEditStock = stock;
  selectedImageFile = null;
  shouldRemoveImage = false;

  // Populate form
  document.querySelector('#editModalTitle').textContent = `Edit ${product.name}`;
  document.querySelector('#editProductName').value = product.name;
  document.querySelector('#editPrice').value = product.price;
  document.querySelector('#editCategory').value = product.category || 'Dessert';
  document.querySelector('#editDescription').value = product.description || '';
  document.querySelector('#editQuantity').value = stock?.quantity || 0;
  document.querySelector('#editUnit').value = stock?.unit || 'pcs';

  const expiryDate = stock?.expiry ? new Date(stock.expiry).toISOString().split('T')[0] : '';
  document.querySelector('#editExpiry').value = expiryDate;

  // Setup image
  updateImageDisplay(product.image);

  // Show modal
  document.querySelector('#productEditOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Update image display
function updateImageDisplay(imageUrl) {
  const container = document.querySelector('#productImageContainer');
  const icon = document.querySelector('#productImageIcon');
  const img = document.querySelector('#productImageDisplay');

  if (imageUrl) {
    icon.style.display = 'none';
    img.src = imageUrl;
    img.style.display = 'block';
    container.classList.add('has-image');
  } else {
    icon.style.display = 'flex';
    img.style.display = 'none';
    img.src = '';
    container.classList.remove('has-image');
  }
}

// Handle image file selection
function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    event.target.value = '';
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Image size must be less than 5MB');
    event.target.value = '';
    return;
  }

  selectedImageFile = file;
  shouldRemoveImage = false;

  const reader = new FileReader();
  reader.onload = (e) => {
    updateImageDisplay(e.target.result);
  };
  reader.readAsDataURL(file);
}

// Remove product image
function removeProductImage(event) {
  event.stopPropagation();
  event.preventDefault();

  if (!confirm('Remove product image?')) return;

  selectedImageFile = null;
  shouldRemoveImage = true;
  updateImageDisplay(null);

  const imageInput = document.querySelector('#productImageInput');
  if (imageInput) {
    imageInput.value = '';
  }

  console.log('Image marked for removal');
}

// Close modal
function closeProductEditModal() {
  document.querySelector('#productEditOverlay').classList.remove('active');
  document.body.style.overflow = '';
  currentEditProduct = null;
  currentEditStock = null;
  selectedImageFile = null;
  shouldRemoveImage = false;
  const imageInput = document.querySelector("#productImageInput");
  if (imageInput) {
    imageInput.value = "";
  }
}

// Handle product update
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

  // Check expiry date
  if (expiryEl && expiryEl.value) {
    const expiryDate = new Date(expiryEl.value);
    const today = new Date();

    // Compare expiry date with today's date
    if (expiryDate < today) {
      alert("Expiry date cannot be in the past.");
      valid = false;
    }
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

// Success notification
function showSuccessMessage(message) {
  const notification = document.createElement('div');
  notification.className = 'success-notification';
  notification.innerHTML = `
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
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// Expose functions globally
window.openProductEditModal = openProductEditModal;
window.closeProductEditModal = closeProductEditModal;
window.removeProductImage = removeProductImage;