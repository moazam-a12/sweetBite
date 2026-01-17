// js/user-management.js

// Load users on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
});

// Load all users
async function loadUsers() {
    try {
        const users = await API.getUsers();
        const tbody = document.getElementById('usersBody');

        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--apple-gray);padding:40px;">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => {
            const badgeClass = `badge-${user.role}`;
            
            return `
                <tr>
                    <td style="font-weight:500;">${user.name || 'Unknown'}</td>
                    <td>${user.email}</td>
                    <td><span class="badge ${badgeClass}">${user.role}</span></td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-apple" style="padding:8px 18px;font-size:0.9rem;" onclick='openEditModal(${JSON.stringify(user)})'>
                                Edit
                            </button>
                            <button class="btn-delete-improved" onclick="deleteUser('${user._id}', '${user.name || user.email}')">
                                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        const tbody = document.getElementById('usersBody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#c62828;padding:40px;">Failed to load users. Please refresh the page.</td></tr>';
    }
}

// Modal Controls
const addUserModal = document.getElementById('addUserModal');
const editUserModal = document.getElementById('editUserModal');

document.getElementById('openAddUserModal').addEventListener('click', () => {
    addUserModal.style.display = 'flex';
    document.getElementById('addUserForm').reset();
});

document.getElementById('closeAddUserModal').addEventListener('click', () => {
    addUserModal.style.display = 'none';
    document.getElementById('addUserForm').reset();
});

document.getElementById('closeEditUserModal').addEventListener('click', () => {
    editUserModal.style.display = 'none';
    document.getElementById('editUserForm').reset();
    document.getElementById('changePasswordFields').style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === addUserModal) {
        addUserModal.style.display = 'none';
    }
    if (e.target === editUserModal) {
        editUserModal.style.display = 'none';
    }
});

// Toggle Password Visibility
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('.eye-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.classList.add('active');
        icon.innerHTML = '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>';
    } else {
        input.type = 'password';
        button.classList.remove('active');
        icon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';
    }
}

// Toggle Change Password Fields
function toggleChangePassword() {
    const fields = document.getElementById('changePasswordFields');
    const btn = document.getElementById('changePasswordBtn');
    
    if (fields.style.display === 'none') {
        fields.style.display = 'block';
        btn.textContent = 'Cancel password change';
        btn.style.color = '#d32f2f';
    } else {
        fields.style.display = 'none';
        btn.textContent = 'Change password?';
        btn.style.color = 'var(--apple-blue)';
        document.getElementById('editNewPassword').value = '';
        document.getElementById('editConfirmPassword').value = '';
    }
}

// Add User
document.getElementById('addUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('addUsername').value.trim();
    const role = document.getElementById('addRole').value;
    const email = document.getElementById('addEmail').value.trim();
    const password = document.getElementById('addPassword').value;
    const confirmPassword = document.getElementById('addConfirmPassword').value;

    // Validate: Check if username contains at least two words
    if (!/^[A-Za-z]+(?:\s+[A-Za-z]+)+$/.test(username)) {
        alert('Please enter a valid full name (at least a first and last name)');
        return;
    }

    // Validation for other fields
    if (!username || !email || !password || !role) {
        alert('Please fill all required fields');
        return;
    }

    if (password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    try {
        const userData = {
            name: username,
            email,
            password,
            role
        };

        await API.createUser(userData);
        
        alert('User created successfully!');
        addUserModal.style.display = 'none';
        document.getElementById('addUserForm').reset();
        loadUsers();
    } catch (error) {
        console.error('Error creating user:', error);
        alert(error.message || 'Failed to create user');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
});

// Open Edit Modal
function openEditModal(user) {
    document.getElementById('editUserId').value = user._id;
    document.getElementById('editUsername').value = user.name || '';
    document.getElementById('editRole').value = user.role;
    document.getElementById('editEmail').value = user.email;
    
    // Reset change password fields
    document.getElementById('changePasswordFields').style.display = 'none';
    document.getElementById('editNewPassword').value = '';
    document.getElementById('editConfirmPassword').value = '';
    const btn = document.getElementById('changePasswordBtn');
    btn.textContent = 'Change password?';
    btn.style.color = 'var(--apple-blue)';
    
    editUserModal.style.display = 'flex';
}

// Edit User
document.getElementById('editUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = document.getElementById('editUserId').value;
    const username = document.getElementById('editUsername').value.trim();
    const role = document.getElementById('editRole').value;
    const email = document.getElementById('editEmail').value.trim();
    const newPassword = document.getElementById('editNewPassword').value;
    const confirmPassword = document.getElementById('editConfirmPassword').value;

    const userData = {
        name: username,
        email,
        role
    };

    // Validate: Check if username contains at least two words
    if (!/^[A-Za-z]+(?:\s+[A-Za-z]+)+$/.test(username)) {
        alert('Please enter a valid full name (at least a first and last name)');
        return;
    }

    // Check if changing password
    const isChangingPassword = document.getElementById('changePasswordFields').style.display === 'block';
    
    if (isChangingPassword) {
        if (!newPassword || newPassword.trim() === '') {
            alert('Please enter a new password or cancel password change');
            return;
        }
        
        if (newPassword.length < 8) {
            alert('Password must be at least 8 characters');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        userData.password = newPassword;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    try {
        await API.updateUser(userId, userData);
        
        alert('User updated successfully!');
        editUserModal.style.display = 'none';
        document.getElementById('editUserForm').reset();
        document.getElementById('changePasswordFields').style.display = 'none';
        loadUsers();
    } catch (error) {
        console.error('Error updating user:', error);
        alert(error.message || 'Failed to update user');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
});

// Delete User
async function deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete user "${userName}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        await API.deleteUser(userId);
        alert('User deleted successfully');
        loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        alert(error.message || 'Failed to delete user');
    }
}

// Expose functions globally
window.togglePasswordVisibility = togglePasswordVisibility;
window.toggleChangePassword = toggleChangePassword;
window.openEditModal = openEditModal;
window.deleteUser = deleteUser;