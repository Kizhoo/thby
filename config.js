// ===== SUPABASE CONFIGURATION =====
// Ganti dengan URL dan Key Supabase Anda
const SUPABASE_CONFIG = {
  url: 'https://sdhjhqyowzvwnwhkhseg.supabase.co',
  anonKey: 'sb_publishable_z1du_teMwE39uEa18VMEJw_8Cqb3cg8'
};

// ===== APP CONFIGURATION =====
const APP_CONFIG = {
  appName: 'To-Kizhoo',
  adminUsername: 'Kizhoo',
  adminPassword: 'kizhoo1602', // Ganti password ini di production!
  itemsPerPage: 10,
  maxFiles: 5,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

// ===== INITIALIZE SUPABASE =====
let supabase;
try {
  supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
} catch (error) {
  console.error('Gagal menginisialisasi Supabase:', error);
}

// ===== HELPER FUNCTIONS =====
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const toastMessage = document.querySelector('.toast-message');
  const toastIcon = document.querySelector('.toast-icon');
  
  if (!toast || !toastMessage || !toastIcon) return;
  
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
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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
  
  if (!token || !expiry) {
    return false;
  }
  
  if (new Date(expiry) < new Date()) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminExpiry');
    return false;
  }
  
  return true;
}

function adminLogin(username, password) {
  if (username === APP_CONFIG.adminUsername && password === APP_CONFIG.adminPassword) {
    const token = btoa(Date.now() + ':' + username);
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminExpiry', expiry.toISOString());
    
    return true;
  }
  return false;
}

function adminLogout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminExpiry');
  window.location.href = 'admin-login.html';
}

// Initialize theme when config loads
document.addEventListener('DOMContentLoaded', initTheme);
