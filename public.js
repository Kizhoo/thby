// ===== PUBLIC APP (index.html) =====

// DOM Elements
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');
const messageType = document.getElementById('messageType');
const photoInput = document.getElementById('photo');
const sendBtn = document.getElementById('sendBtn');
const charCount = document.getElementById('charCount');
const uploadArea = document.getElementById('uploadArea');
const previewContainer = document.getElementById('previewContainer');
const previewBox = document.getElementById('previewBox');
const clearAllBtn = document.getElementById('clearAllBtn');
const newMessageBtn = document.getElementById('newMessageBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const successModal = document.getElementById('successModal');

// App State
let files = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadStatistics();
  updateCharCount();
});

// Event Listeners
function initEventListeners() {
  // Form events
  messageInput.addEventListener('input', updateCharCount);
  uploadArea.addEventListener('dragover', handleDragOver);
  uploadArea.addEventListener('dragleave', handleDragLeave);
  uploadArea.addEventListener('drop', handleDrop);
  photoInput.addEventListener('change', handleFileSelect);
  clearAllBtn.addEventListener('click', clearAllFiles);
  sendBtn.addEventListener('click', sendMessage);
  
  // Modal events
  if (newMessageBtn) {
    newMessageBtn.addEventListener('click', resetForm);
  }
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      successModal.classList.add('hidden');
    });
  }
  
  // Enter key for username
  usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      messageInput.focus();
    }
  });
  
  // Enter key for message (but allow shift+enter for new line)
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// Character count
function updateCharCount() {
  const count = messageInput.value.length;
  charCount.textContent = `${count}/2000`;
  charCount.style.color = count > 1900 ? '#f87171' : count > 1700 ? '#fbbf24' : '#94a3b8';
}

// File handling
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  uploadArea.classList.remove('dragover');
  const droppedFiles = e.dataTransfer.files;
  handleFiles(droppedFiles);
}

function handleFileSelect(e) {
  handleFiles(e.target.files);
}

function handleFiles(fileList) {
  const newFiles = Array.from(fileList).filter(file => {
    return file.type.startsWith('image/') && file.size <= APP_CONFIG.maxFileSize;
  });
  
  if (newFiles.length > APP_CONFIG.maxFiles) {
    showToast(`Maksimal ${APP_CONFIG.maxFiles} file gambar`, 'warning');
    newFiles.length = APP_CONFIG.maxFiles;
  }
  
  files.push(...newFiles);
  updatePreview();
  
  if (files.length > 0) {
    previewContainer.classList.add('show');
  }
  
  if (newFiles.length < fileList.length) {
    showToast('Beberapa file tidak sesuai (hanya gambar maksimal 5MB)', 'warning');
  }
}

function updatePreview() {
  previewBox.innerHTML = '';
  
  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const item = document.createElement('div');
      item.className = 'preview-item';
      
      const img = document.createElement('img');
      img.src = e.target.result;
      img.alt = `Preview ${index + 1}`;
      
      const removeBtn = document.createElement('div');
      removeBtn.className = 'remove-btn';
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.addEventListener('click', () => removeFile(index));
      
      item.appendChild(img);
      item.appendChild(removeBtn);
      previewBox.appendChild(item);
    };
    reader.readAsDataURL(file);
  });
}

function removeFile(index) {
  files.splice(index, 1);
  updatePreview();
  if (files.length === 0) {
    previewContainer.classList.remove('show');
  }
}

function clearAllFiles() {
  files = [];
  photoInput.value = '';
  previewContainer.classList.remove('show');
  previewBox.innerHTML = '';
}

// Load statistics
async function loadStatistics() {
  try {
    // Total messages
    const { count: total } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    
    // Today's messages
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { count: todayCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());
    
    // Unread messages
    const { count: unread } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    
    // Messages with photos
    const { count: withPhotos } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .not('photos', 'is', null);
    
    // Update DOM
    document.getElementById('totalMessages').textContent = total || 0;
    document.getElementById('todayMessages').textContent = todayCount || 0;
    document.getElementById('unreadMessages').textContent = unread || 0;
    document.getElementById('withPhotos').textContent = withPhotos || 0;
    
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

// Send message
async function sendMessage() {
  // Validation
  const username = usernameInput.value.trim();
  const message = messageInput.value.trim();
  const type = messageType.value;
  const privacy = document.querySelector('input[name="privacy"]:checked').value;
  
  if (!username || !message) {
    showToast('Nama dan pesan wajib diisi', 'error');
    return;
  }
  
  if (message.length > 2000) {
    showToast('Pesan maksimal 2000 karakter', 'error');
    return;
  }
  
  showLoading();
  
  try {
    // Convert files to base64
    let photosBase64 = [];
    if (files.length > 0) {
      for (const file of files) {
        const base64 = await fileToBase64(file);
        photosBase64.push(base64);
      }
    }
    
    // Insert to database
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        username,
        message,
        type,
        privacy,
        photos: photosBase64.length > 0 ? photosBase64 : null,
        is_read: false,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    
    showToast('Pesan berhasil dikirim!', 'success');
    
    // Show success modal
    successModal.classList.remove('hidden');
    
    // Reset form
    resetForm();
    
    // Update statistics
    await loadStatistics();
    
  } catch (error) {
    console.error('Error sending message:', error);
    showToast('Gagal mengirim pesan: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Reset form
function resetForm() {
  usernameInput.value = '';
  messageInput.value = '';
  messageType.value = 'pesan';
  clearAllFiles();
  updateCharCount();
  successModal.classList.add('hidden');
  usernameInput.focus();
}
