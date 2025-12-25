// ===== SUPABASE CONFIGURATION =====
// GANTI DENGAN URL DAN KEY DARI SUPABASE ANDA!
const SUPABASE_CONFIG = {
  url: 'https://ttylewbnhhhsgtaijqvb.supabase.co',
  anonKey: 'sb_publishable__dylrUDStK0yejyhVNvaKA_Uf32RZkn'
};

// ===== APP CONFIGURATION =====
const APP_CONFIG = {
  appName: 'To-Kizhoo',
  adminUsername: 'admin',
  adminPassword: 'kizhoo123', // Ganti password ini di production!
  itemsPerPage: 10,
  maxFiles: 5,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

// ===== INITIALIZE SUPABASE =====
let supabase;
try {
  supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  console.log('Supabase initialized');
} catch (error) {
  console.error('Gagal menginisialisasi Supabase:', error);
}

// ===== HELPER FUNCTIONS =====
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const toastMessage = document.querySelector('.toast-message');
  const toastIcon = document.querySelector('.toast-icon');
  
  if (!toast || !toastMessage || !toastIcon) {
    console.log('Toast elements not found');
    return;
  }
  
  toastMessage.textContent = message;
  toast.className = 'toast';
  toast.classList.add(type);
  
  let iconClass = 'fas fa-info-circle';
  if (type === 'success') iconClass = 'fas fa-check-circle';
  if (type === 'error') iconClass = 'fas fa-exclamation-circle';
  if (type === 'warning') iconClass = 'fas fa-exclamation-triangle';
  
  toastIcon.className = 'toast-icon';
  toastIcon.innerHTML = `<i class="${iconClass}"></i>`;
  
  toast.classList.add('show');
  
  // Auto hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
  
  // Log to console for debugging
  console.log(`Toast: ${type} - ${message}`);
}

function showLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.classList.remove('hidden');
  }
}

function hideLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
  }
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}

function getTypeLabel(type) {
  const labels = {
    'pesan': 'Pesan Biasa',
    'kritik': 'Kritik & Saran',
    'dukungan': 'Dukungan',
    'tanya': 'Pertanyaan',
    'lainnya': 'Lainnya'
  };
  return labels[type] || type;
}

// ===== THEME MANAGEMENT =====
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;
  
  const savedTheme = localStorage.getItem('theme') || 'dark';
  setTheme(savedTheme);
  
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });
}

function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
  }
  localStorage.setItem('theme', theme);
}

// ===== ADMIN AUTH FUNCTIONS =====
function checkAdminAuth() {
  const token = localStorage.getItem('adminToken');
  const expiry = localStorage.getItem('adminExpiry');
  
  console.log('Checking auth:', { token, expiry });
  
  if (!token || !expiry) {
    console.log('No token or expiry found');
    return false;
  }
  
  const expiryDate = new Date(expiry);
  const now = new Date();
  
  console.log('Expiry date:', expiryDate);
  console.log('Current date:', now);
  console.log('Is expired:', expiryDate < now);
  
  if (expiryDate < now) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminExpiry');
    console.log('Token expired, removed from storage');
    return false;
  }
  
  return true;
}

function adminLogin(username, password) {
  console.log('Attempting login with:', { username, password });
  console.log('Expected:', APP_CONFIG.adminUsername, APP_CONFIG.adminPassword);
  
  if (username === APP_CONFIG.adminUsername && password === APP_CONFIG.adminPassword) {
    const token = btoa(Date.now() + ':' + username + ':' + Math.random());
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminExpiry', expiry.toISOString());
    
    console.log('Login successful, token set:', token.substring(0, 20) + '...');
    return true;
  }
  
  console.log('Login failed - incorrect credentials');
  return false;
}

function adminLogout() {
  console.log('Logging out...');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminExpiry');
  window.location.href = 'admin-login.html';
}

// ===== VALIDATION FUNCTIONS =====
function validateFile(file) {
  if (!file.type.startsWith('image/')) {
    return 'File harus berupa gambar';
  }
  
  if (file.size > APP_CONFIG.maxFileSize) {
    return `Ukuran file maksimal ${APP_CONFIG.maxFileSize / 1024 / 1024}MB`;
  }
  
  return null;
}

// Initialize theme when config loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Config loaded');
  initTheme();
});
