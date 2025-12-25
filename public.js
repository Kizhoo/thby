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
const successModal = document.getElementById('successModal');

// App State
let files = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  console.log('Public app initialized');
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
  
  // Send button
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  } else {
    console.error('Send button not found!');
  }
  
  // Modal events
  const newMessageBtn = document.getElementById('newMessageBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  
  if (newMessageBtn) {
    newMessageBtn.addEventListener('click', resetForm);
  }
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      if (successModal) successModal.classList.add('hidden');
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
  
  // Click on browse link
  const browseLink = document.querySelector('.browse-link');
  if (browseLink) {
    browseLink.addEventListener('click', () => {
      photoInput.click();
    });
  }
}

// Character count
function updateCharCount() {
  if (!charCount) return;
  
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
  if (!fileList || fileList.length === 0) return;
  
  const newFiles = [];
  
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const error = validateFile(file);
    
    if (error) {
      showToast(`File "${file.name}": ${error}`, 'warning');
      continue;
    }
    
    newFiles.push(file);
  }
  
  if (newFiles.length + files.length > APP_CONFIG.maxFiles) {
    showToast(`Maksimal ${APP_CONFIG.maxFiles} file gambar`, 'warning');
    newFiles.length = APP_CONFIG.maxFiles - files.length;
  }
  
  files.push(...newFiles);
  updatePreview();
  
  if (files.length > 0) {
    previewContainer.classList.add('show');
  }
}

function updatePreview() {
  if (!previewBox) return;
  
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
  if (photoInput) photoInput.value = '';
  previewContainer.classList.remove('show');
  if (previewBox) previewBox.innerHTML = '';
}

// Load statistics
async function loadStatistics() {
  try {
    console.log('Loading statistics...');
    
    if (!supabase) {
      console.error('Supabase not initialized');
      return;
    }
    
    // Total messages
    const { count: total, error: totalError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) {
      console.error('Error loading total messages:', totalError);
    } else {
      const totalEl = document.getElementById('totalMessages');
      if (totalEl) totalEl.textContent = total || 0;
    }
    
    // Today's messages
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { count: todayCount, error: todayError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());
    
    if (todayError) {
      console.error('Error loading today messages:', todayError);
    } else {
      const todayEl = document.getElementById('todayMessages');
      if (todayEl) todayEl.textContent = todayCount || 0;
    }
    
    // Unread messages
    const { count: unread, error: unreadError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    
    if (unreadError) {
      console.error('Error loading unread messages:', unreadError);
    } else {
      const unreadEl = document.getElementById('unreadMessages');
      if (unreadEl) unreadEl.textContent = unread || 0;
    }
    
    // Messages with photos
    const { count: withPhotos, error: photosError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .not('photos', 'is', null);
    
    if (photosError) {
      console.error('Error loading messages with photos:', photosError);
    } else {
      const photosEl = document.getElementById('withPhotos');
      if (photosEl) photosEl.textContent = withPhotos || 0;
    }
    
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

// Send message
async function sendMessage() {
  console.log('Sending message...');
  
  // Validation
  const username = usernameInput.value.trim();
  const message = messageInput.value.trim();
  const type = messageType ? messageType.value : 'pesan';
  const privacyElement = document.querySelector('input[name="privacy"]:checked');
  const privacy = privacyElement ? privacyElement.value : 'public';
  
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
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const base64 = await fileToBase64(file);
          photosBase64.push(base64);
          console.log(`Converted file ${i + 1} to base64`);
        } catch (error) {
          console.error(`Error converting file ${i + 1}:`, error);
          showToast(`Gagal mengkonversi file ${i + 1}`, 'warning');
        }
      }
    }
    
    // Prepare data for Supabase
    const messageData = {
      username,
      message,
      type,
      privacy,
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    // Only add photos if we have any
    if (photosBase64.length > 0) {
      messageData.photos = photosBase64;
    }
    
    console.log('Sending data to Supabase:', { ...messageData, photos: photosBase64.length });
    
    // Insert to database
    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select();
    
    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('Message sent successfully:', data);
    showToast('Pesan berhasil dikirim!', 'success');
    
    // Show success modal
    if (successModal) {
      successModal.classList.remove('hidden');
    }
    
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
  if (usernameInput) usernameInput.value = '';
  if (messageInput) messageInput.value = '';
  if (messageType) messageType.value = 'pesan';
  
  // Reset privacy to public
  const privacyPublic = document.querySelector('input[name="privacy"][value="public"]');
  if (privacyPublic) privacyPublic.checked = true;
  
  clearAllFiles();
  updateCharCount();
  
  if (successModal) {
    successModal.classList.add('hidden');
  }
  
  if (usernameInput) usernameInput.focus();
                    }
