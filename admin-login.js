here// ===== ADMIN LOGIN (admin-login.html) =====

// DOM Elements
const adminUsername = document.getElementById('adminUsername');
const adminPassword = document.getElementById('adminPassword');
const loginBtn = document.getElementById('loginBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  if (checkAdminAuth()) {
    window.location.href = 'admin-dashboard.html';
  }
  
  // Event listeners
  loginBtn.addEventListener('click', handleLogin);
  adminPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
});

// Handle login
function handleLogin() {
  const username = adminUsername.value.trim();
  const password = adminPassword.value.trim();
  
  if (!username || !password) {
    showToast('Username dan password harus diisi', 'error');
    return;
  }
  
  showLoading();
  
  // Simulate API call
  setTimeout(() => {
    if (adminLogin(username, password)) {
      showToast('Login berhasil!', 'success');
      setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
      }, 1000);
    } else {
      showToast('Username atau password salah', 'error');
      adminPassword.value = '';
    }
    hideLoading();
  }, 500);
}
