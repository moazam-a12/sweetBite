// Auth Guard - Protect routes based on role
function requireRole(...allowedRoles) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Not logged in
  if (!token || !role) {
    window.location.href = '../../login.html';
    return false;
  }

  // Pending approval
  if (role === 'pending') {
    window.location.href = '../../pending.html';
    return false;
  }

  // Check if role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    alert('Access denied. You do not have permission to view this page.');
    localStorage.clear();
    window.location.href = '../../login.html';
    return false;
  }

  return true;
}

// Get current user info
function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Logout function
function logout() {
  localStorage.clear();
  window.location.href = '../../login.html';
}