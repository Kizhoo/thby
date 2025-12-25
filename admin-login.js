// ===== ADMIN LOGIN (admin-login.html) =====

// DOM Elements
const adminUsername = document.getElementById('adminUsername');
const adminPassword = document.getElementById('adminPassword');
const loginBtn = document.getElementById('loginBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin login page loaded');
  
  // Redirect if already logged in
  if (checkAdminAuth()) {
    console.log('Already logged in, redirecting to dashboard');
    window.location.href = 'admin-dashboard.html';
  }
  
  // Event listeners
  if (loginBtn) {
    console.log('Adding click listener to login button');
    loginBtn.addEventListener('click', handleLogin);
  } else {
    console.error('Login button not found!');
  }
  
  if (adminPassword) {
    adminPassword.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
  }
  
  // Focus on username input
  if (adminUsername) {
    adminUsername.focus();
  }
});

// Handle login
function handleLogin() {
  console.log('Login button clicked');
  
  const username = adminUsername ? adminUsername.value.trim() : '';
  const password = adminPassword ? adminPassword.value.trim() : '';
  
  console.log('Login attempt:', { username, password });
  
  if (!username || !password) {
    showToast('Username dan password harus diisi', 'error');
    return;
  }
  
  showLoading();
  
  // Simulate API call with delay
  setTimeout(() => {
    try {
      if (adminLogin(username, password)) {
        console.log('Login successful');
        showToast('Login berhasil! Mengalihkan...', 'success');
        
        // Clear password field
        if (adminPassword) adminPassword.value = '';
        
        // Redirect after delay
        setTimeout(() => {
          window.location.href = 'admin-dashboard.html';
        }, 1000);
      } else {
        console.log('Login failed - incorrect credentials');
        showToast('Username atau password salah', 'error');
        if (adminPassword) adminPassword.value = '';
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
      hideLoading();
    }
  }, 500);
}
