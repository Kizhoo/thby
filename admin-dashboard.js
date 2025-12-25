// ===== ADMIN DASHBOARD (admin-dashboard.html) =====

// DOM Elements
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const markAllReadBtn = document.getElementById('markAllReadBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const exportBtn = document.getElementById('exportBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const messagesTableBody = document.getElementById('messagesTableBody');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const filterButtons = document.querySelectorAll('.filter-btn');
const typeFilter = document.getElementById('typeFilter');
const selectAllCheckbox = document.getElementById('selectAll');

// Modal Elements
const messageModal = document.getElementById('messageModal');
const closeMessageModal = document.getElementById('closeMessageModal');
const modalSender = document.getElementById('modalSender');
const modalType = document.getElementById('modalType');
const modalDate = document.getElementById('modalDate');
const modalStatus = document.getElementById('modalStatus');
const modalMessage = document.getElementById('modalMessage');
const modalPhotos = document.getElementById('modalPhotos');
const markReadBtn = document.getElementById('markReadBtn');
const deleteMessageBtn = document.getElementById('deleteMessageBtn');

// Image Viewer
const imageViewer = document.getElementById('imageViewer');
const viewerImage = document.getElementById('viewerImage');

// App State
let messages = [];
let currentPage = 1;
let totalPages = 1;
let currentFilter = 'all';
let searchQuery = '';
let selectedMessages = new Set();
let currentMessageId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Admin dashboard loaded');
  
  // STRICT AUTH CHECK - Redirect jika belum login
  if (!checkAdminAuth()) {
    console.log('Not authenticated, redirecting to login');
    showToast('Harap login terlebih dahulu', 'error');
    setTimeout(() => {
      window.location.href = 'admin-login.html';
    }, 1000);
    return;
  }
  
  console.log('Authenticated, loading admin data...');
  
  initEventListeners();
  await loadAdminData();
});

// Event Listeners
function initEventListeners() {
  console.log('Initializing event listeners');
  
  // Navigation
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      console.log('Logout clicked');
      adminLogout();
    });
  } else {
    console.error('Logout button not found');
  }
  
  // Actions
  if (refreshBtn) refreshBtn.addEventListener('click', loadAdminData);
  if (markAllReadBtn) markAllReadBtn.addEventListener('click', markAllAsRead);
  if (deleteAllBtn) deleteAllBtn.addEventListener('click', deleteAllMessages);
  if (exportBtn) exportBtn.addEventListener('click', exportData);
  
  // Search
  if (searchBtn) searchBtn.addEventListener('click', performSearch);
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }
  
  // Filter buttons
  if (filterButtons.length > 0) {
    filterButtons.forEach(btn => {
      if (btn.dataset.filter) {
        btn.addEventListener('click', () => {
          filterButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentFilter = btn.dataset.filter;
          currentPage = 1;
          loadMessages();
        });
      }
    });
  }
  
  // Type filter
  if (typeFilter) {
    typeFilter.addEventListener('change', () => {
      currentPage = 1;
      loadMessages();
    });
  }
  
  // Pagination
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadMessages();
      }
    });
  }
  
  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadMessages();
      }
    });
  }
  
  // Select all checkbox
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
      const checkboxes = document.querySelectorAll('.message-checkbox');
      checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
        const id = cb.dataset.id;
        if (e.target.checked) {
          selectedMessages.add(id);
        } else {
          selectedMessages.delete(id);
        }
      });
    });
  }
  
  // Modal
  if (closeMessageModal) {
    closeMessageModal.addEventListener('click', () => {
      if (messageModal) messageModal.classList.remove('show');
    });
  }
  
  if (markReadBtn) {
    markReadBtn.addEventListener('click', markCurrentMessageAsRead);
  }
  
  if (deleteMessageBtn) {
    deleteMessageBtn.addEventListener('click', deleteCurrentMessage);
  }
  
  // Image viewer
  const imageViewerClose = document.querySelector('.image-viewer-close');
  if (imageViewerClose) {
    imageViewerClose.addEventListener('click', () => {
      if (imageViewer) imageViewer.classList.remove('show');
    });
  }
  
  // Close modals on outside click
  window.addEventListener('click', (e) => {
    if (e.target === messageModal) {
      messageModal.classList.remove('show');
    }
    if (e.target === imageViewer) {
      imageViewer.classList.remove('show');
    }
  });
}

// Load admin data
async function loadAdminData() {
  console.log('Loading admin data...');
  await Promise.all([
    loadAdminStatistics(),
    loadMessages()
  ]);
}

// Load admin statistics
async function loadAdminStatistics() {
  try {
    console.log('Loading admin statistics...');
    
    if (!supabase) {
      console.error('Supabase not initialized');
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Total messages
    const { count: total, error: totalError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) {
      console.error('Error loading total messages:', totalError);
    } else {
      const totalEl = document.getElementById('adminTotalMessages');
      if (totalEl) totalEl.textContent = total || 0;
    }
    
    // Unread messages
    const { count: unread, error: unreadError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    
    if (unreadError) {
      console.error('Error loading unread messages:', unreadError);
    } else {
      const unreadEl = document.getElementById('adminUnread');
      if (unreadEl) unreadEl.textContent = unread || 0;
    }
    
    // Today's messages
    const { count: todayCount, error: todayError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());
    
    if (todayError) {
      console.error('Error loading today messages:', todayError);
    } else {
      const todayEl = document.getElementById('adminToday');
      if (todayEl) todayEl.textContent = todayCount || 0;
    }
    
    // Messages with photos
    const { count: withPhotos, error: photosError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .not('photos', 'is', null);
    
    if (photosError) {
      console.error('Error loading messages with photos:', photosError);
    } else {
      const photosEl = document.getElementById('adminPhotos');
      if (photosEl) photosEl.textContent = withPhotos || 0;
    }
    
  } catch (error) {
    console.error('Error loading admin stats:', error);
    showToast('Gagal memuat statistik: ' + error.message, 'error');
  }
}

// Load messages
async function loadMessages() {
  console.log('Loading messages, page:', currentPage);
  
  showLoading();
  
  try {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }
    
    let query = supabase
      .from('messages')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (currentFilter === 'unread') {
      query = query.eq('is_read', false);
    } else if (currentFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query = query.gte('created_at', today.toISOString())
                  .lt('created_at', tomorrow.toISOString());
    } else if (currentFilter === 'with-photos') {
      query = query.not('photos', 'is', null);
    } else if (currentFilter === 'private') {
      query = query.eq('privacy', 'private');
    }
    
    // Apply type filter
    if (typeFilter && typeFilter.value) {
      query = query.eq('type', typeFilter.value);
    }
    
    // Apply search
    if (searchQuery) {
      query = query.or(`username.ilike.%${searchQuery}%,message.ilike.%${searchQuery}%,type.ilike.%${searchQuery}%`);
    }
    
    // Apply pagination
    const from = (currentPage - 1) * APP_CONFIG.itemsPerPage;
    const to = from + APP_CONFIG.itemsPerPage - 1;
    
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    console.log('Messages loaded:', data ? data.length : 0);
    messages = data || [];
    totalPages = Math.ceil((count || 0) / APP_CONFIG.itemsPerPage);
    
    renderMessagesTable();
    updatePagination();
    
  } catch (error) {
    console.error('Error loading messages:', error);
    showToast('Gagal memuat pesan: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Render messages table
function renderMessagesTable() {
  console.log('Rendering messages table');
  
  if (!messagesTableBody) {
    console.error('Messages table body not found');
    return;
  }
  
  messagesTableBody.innerHTML = '';
  selectedMessages.clear();
  
  if (messages.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td colspan="7" style="text-align: center; padding: 2rem;">
        <i class="fas fa-inbox" style="font-size: 3rem; color: #475569; margin-bottom: 1rem;"></i>
        <p>Tidak ada pesan ditemukan</p>
      </td>
    `;
    messagesTableBody.appendChild(row);
    return;
  }
  
  messages.forEach((msg, index) => {
    const row = document.createElement('tr');
    if (!msg.is_read) row.classList.add('unread');
    
    // Format date
    const date = new Date(msg.created_at);
    const dateStr = date.toLocaleDateString('id-ID');
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    // Truncate message
    const messagePreview = msg.message.length > 100 
      ? msg.message.substring(0, 100) + '...' 
      : msg.message;
    
    row.innerHTML = `
      <td><input type="checkbox" class="message-checkbox" data-id="${msg.id}"></td>
      <td><strong>${msg.username || 'Tidak diketahui'}</strong></td>
      <td><span class="message-type">${getTypeLabel(msg.type || 'pesan')}</span></td>
      <td class="message-content">${messagePreview}</td>
      <td>${dateStr}<br><small>${timeStr}</small></td>
      <td>
        ${msg.is_read 
          ? '<span style="color:#10b981;"><i class="fas fa-check-circle"></i> Dibaca</span>'
          : '<span style="color:#f59e0b;"><i class="fas fa-clock"></i> Baru</span>'
        }
        ${msg.photos && msg.photos.length > 0 ? '<br><small><i class="fas fa-image"></i> Foto</small>' : ''}
      </td>
      <td>
        <div class="message-actions">
          <button class="action-icon view-icon" data-index="${index}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-icon read-icon" data-id="${msg.id}">
            <i class="fas fa-check"></i>
          </button>
          <button class="action-icon delete-icon" data-id="${msg.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    
    messagesTableBody.appendChild(row);
  });
  
  // Add event listeners to action buttons
  document.querySelectorAll('.view-icon').forEach(btn => {
    btn.addEventListener('click', () => viewMessage(parseInt(btn.dataset.index)));
  });
  
  document.querySelectorAll('.read-icon').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      markMessageAsRead(btn.dataset.id);
    });
  });
  
  document.querySelectorAll('.delete-icon').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSingleMessage(btn.dataset.id);
    });
  });
  
  // Checkbox events
  document.querySelectorAll('.message-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      if (e.target.checked) {
        selectedMessages.add(id);
      } else {
        selectedMessages.delete(id);
      }
      updateSelectAllCheckbox();
    });
  });
}

function updatePagination() {
  if (!pageInfo || !prevPageBtn || !nextPageBtn) return;
  
  pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
}

function updateSelectAllCheckbox() {
  if (!selectAllCheckbox) return;
  const totalCheckboxes = document.querySelectorAll('.message-checkbox').length;
  const checkedCount = selectedMessages.size;
  selectAllCheckbox.checked = totalCheckboxes > 0 && checkedCount === totalCheckboxes;
  selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < totalCheckboxes;
}

function performSearch() {
  if (!searchInput) return;
  
  searchQuery = searchInput.value.trim();
  currentPage = 1;
  loadMessages();
}

// View message details
function viewMessage(index) {
  console.log('Viewing message at index:', index);
  
  if (!messages[index]) {
    showToast('Pesan tidak ditemukan', 'error');
    return;
  }
  
  const msg = messages[index];
  currentMessageId = msg.id;
  
  // Format date
  const date = new Date(msg.created_at);
  const dateStr = date.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const timeStr = date.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Set modal content
  if (modalSender) modalSender.textContent = msg.username || 'Tidak diketahui';
  if (modalType) modalType.textContent = getTypeLabel(msg.type || 'pesan');
  if (modalDate) modalDate.textContent = `${dateStr} ${timeStr}`;
  if (modalStatus) modalStatus.textContent = msg.is_read ? 'Sudah Dibaca' : 'Belum Dibaca';
  if (modalMessage) modalMessage.textContent = msg.message || '(Tidak ada pesan)';
  
  // Display photos
  if (modalPhotos) {
    modalPhotos.innerHTML = '';
    if (msg.photos && Array.isArray(msg.photos) && msg.photos.length > 0) {
      msg.photos.forEach((photo, i) => {
        if (photo && typeof photo === 'string' && photo.startsWith('data:image')) {
          const photoItem = document.createElement('div');
          photoItem.className = 'photo-item';
          photoItem.innerHTML = `<img src="${photo}" alt="Foto ${i + 1}" data-index="${i}">`;
          modalPhotos.appendChild(photoItem);
        }
      });
      
      // Add click event to photos
      modalPhotos.querySelectorAll('img').forEach(img => {
        img.addEventListener('click', () => {
          if (viewerImage) viewerImage.src = img.src;
          if (imageViewer) imageViewer.classList.add('show');
        });
      });
    }
  }
  
  if (messageModal) {
    messageModal.classList.add('show');
  }
  
  // Mark as read when viewed
  if (!msg.is_read && msg.id) {
    markMessageAsRead(msg.id, false);
  }
}

// Mark message as read
async function markMessageAsRead(messageId, showToast = true) {
  try {
    console.log('Marking message as read:', messageId);
    
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);
    
    if (error) throw error;
    
    if (showToast) {
      showToast('Pesan ditandai sebagai dibaca', 'success');
    }
    
    // Update UI
    const row = document.querySelector(`tr:has(.message-checkbox[data-id="${messageId}"])`);
    if (row) {
      row.classList.remove('unread');
    }
    
    // Reload data
    await loadAdminData();
    
  } catch (error) {
    console.error('Error marking message as read:', error);
    if (showToast) {
      showToast('Gagal menandai pesan: ' + error.message, 'error');
    }
  }
}

async function markCurrentMessageAsRead() {
  if (currentMessageId) {
    await markMessageAsRead(currentMessageId);
  }
}

// Mark all as read
async function markAllAsRead() {
  if (!confirm('Tandai semua pesan sebagai sudah dibaca?')) return;
  
  showLoading();
  
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('is_read', false);
    
    if (error) throw error;
    
    showToast('Semua pesan ditandai sebagai dibaca', 'success');
    await loadAdminData();
    
  } catch (error) {
    console.error('Error marking all as read:', error);
    showToast('Gagal menandai pesan: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Delete single message
async function deleteSingleMessage(messageId) {
  if (!confirm('Hapus pesan ini?')) return;
  
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
    
    if (error) throw error;
    
    showToast('Pesan berhasil dihapus', 'success');
    await loadAdminData();
    
  } catch (error) {
    console.error('Error deleting message:', error);
    showToast('Gagal menghapus pesan: ' + error.message, 'error');
  }
}

// Delete current message (from modal)
async function deleteCurrentMessage() {
  if (currentMessageId) {
    await deleteSingleMessage(currentMessageId);
    if (messageModal) messageModal.classList.remove('show');
  }
}

// Delete all messages
async function deleteAllMessages() {
  if (!confirm('HAPUS SEMUA PESAN? Tindakan ini tidak dapat dibatalkan!')) return;
  
  showLoading();
  
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .gte('id', 0); // Delete all
    
    if (error) throw error;
    
    showToast('Semua pesan berhasil dihapus', 'success');
    await loadAdminData();
    
  } catch (error) {
    console.error('Error deleting all messages:', error);
    showToast('Gagal menghapus pesan: ' + error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Export data
async function exportData() {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      showToast('Tidak ada data untuk diexport', 'warning');
      return;
    }
    
    // Convert to CSV
    const headers = ['ID', 'Nama', 'Jenis', 'Pesan', 'Privasi', 'Status', 'Tanggal', 'Jumlah Foto'];
    const rows = data.map(msg => [
      msg.id,
      `"${(msg.username || '').replace(/"/g, '""')}"`,
      msg.type || 'pesan',
      `"${(msg.message || '').replace(/"/g, '""')}"`,
      msg.privacy || 'public',
      msg.is_read ? 'Dibaca' : 'Belum Dibaca',
      formatDate(msg.created_at),
      msg.photos ? (Array.isArray(msg.photos) ? msg.photos.length : 0) : 0
    ]);
    
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    // Create download link
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `messages_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Data berhasil diexport', 'success');
    
  } catch (error) {
    console.error('Error exporting data:', error);
    showToast('Gagal mengexport data: ' + error.message, 'error');
  }
    }
