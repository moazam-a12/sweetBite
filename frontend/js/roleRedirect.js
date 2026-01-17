function redirectByRole(role) {
  const routes = {
    customer: 'customer/html/dashboard.html',
    inventory: 'inventory/html/dashboard.html',
    chef: 'chef/html/dashboard.html',
    cashier: 'cashier/html/dashboard.html',
    delivery: 'delivery/html/dashboard.html',
    manager: 'manager/html/dashboard.html',
    admin: 'manager/html/dashboard.html',
    pending: 'pending.html'
  };

  const destination = routes[role];

  if (!destination) {
    alert('Unauthorized role');
    localStorage.clear();
    window.location.href = 'index.html';
    return;
  }

  window.location.href = destination;
}