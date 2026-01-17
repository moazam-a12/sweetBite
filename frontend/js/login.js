// Unified Login System - All Roles
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorAlert = document.getElementById("errorAlert");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email");
    const password = document.getElementById("password");

    // Reset validation
    email.classList.remove("is-invalid");
    password.classList.remove("is-invalid");
    if (errorAlert) {
      errorAlert.style.display = "none";
      errorAlert.classList.add("d-none");
    }

    // Validate
    let valid = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.classList.add("is-invalid");
      valid = false;
    }
    if (!password.value.trim()) {
      password.classList.add("is-invalid");
      valid = false;
    }

    if (!valid) {
      if (errorAlert) {
        errorAlert.textContent = "Please enter valid credentials";
        errorAlert.style.display = "block";
        errorAlert.classList.remove("d-none");
      }
      return;
    }

    try {
      // Call unified login API
      const data = await API.login(email.value, password.value);
      
      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Check if pending
      if (data.user.role === 'pending') {
        window.location.href = 'pending.html';
        return;
      }

      // Show success message
      showToast("Login successful!");

      // Redirect based on role
      setTimeout(() => {
        redirectByRole(data.user.role);
      }, 500);

    } catch (error) {
      if (errorAlert) {
        errorAlert.textContent = error.message || "Invalid credentials";
        errorAlert.style.display = "block";
        errorAlert.classList.remove("d-none");
      }
      showToast(error.message || "Login failed", "danger");
    }
  });
});

// Password Visibility
function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  const icon = button.querySelector("svg");

  if (input.type === "password") {
    input.type = "text";
    icon.innerHTML = `
      <path d="M2.1 3.51L1 4.61l4.06 4.06C3.18 9.86 1.77 11.81 1 14c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.27 4.38-.77l3.01 3.01 1.41-1.41L2.1 3.51zM12 17c-2.76 0-5-2.24-5-5 0-.77.18-1.5.49-2.15l6.66 6.66c-.65.31-1.38.49-2.15.49zm4.95-1.12L8.12 7.05C8.75 6.74 9.36 6.5 12 6.5c2.76 0 5 2.24 5 5 0 .64-.13 1.25-.35 1.83z"/>
    `;
  } else {
    input.type = "password";
    icon.innerHTML = `
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
    `;
  }
}


// Redirect user based on their role
function redirectByRole(role) {
  const routes = {
    'customer': 'customer/html/dashboard.html',
    'inventory': 'inventory/html/dashboard.html',
    'chef': 'chef/html/dashboard.html',
    'cashier': 'cashier/html/dashboard.html',
    'delivery': 'delivery/html/dashboard.html',
    'manager': 'manager/html/dashboard.html',
    'admin': 'manager/html/dashboard.html' // Admin uses manager dashboard
  };

  const destination = routes[role] || 'customer/html/dashboard.html';
  window.location.href = destination;
}

// Toast notification
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = "toast-popup";
  toast.style.background = type === "danger" ? "#c62828" : "var(--apple-dark)";
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "30px";
  toast.style.right = "30px";
  toast.style.color = "white";
  toast.style.padding = "16px 24px";
  toast.style.borderRadius = "12px";
  toast.style.boxShadow = "0 10px 40px rgba(0,0,0,0.15)";
  toast.style.zIndex = "10000";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(20px)";
  toast.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 50);
  
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}