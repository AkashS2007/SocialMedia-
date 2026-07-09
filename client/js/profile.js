/* ============================================
   VIBE — Profile Page Logic
   ============================================ */

(function () {
  // Auth guard
  if (!API.isLoggedIn()) {
    window.location.href = '/';
    return;
  }

  const currentUser = API.getUser();
  let profileUser = null;
  let postOffset = 0;
  const LIMIT = 10;
  let hasMore = true;
  let loading = false;

  // Parse user ID from URL
  const params = new URLSearchParams(window.location.search);
  let userId = params.get('id');
  if (!userId) userId = currentUser.id;
  const isOwnProfile = String(userId) === String(currentUser.id);

  // Render navbar
  document.getElementById('navbar').innerHTML = Components.renderNavbar('');

  // Initialize event listeners
  Components.initializeEventListeners();

  // ---------- Load Profile ----------
  async function loadProfile() {
    try {
      const data = await API.users.getById(userId);
      profileUser = data.user || data;

      // Fetch stats
      let stats = {
        post_count: profileUser.post_count || 0,
        follower_count: profileUser.follower_count || 0,
        following_count: profileUser.following_count || 0,
      };

      document.title = `${profileUser.display_name || profileUser.username} — Vibe`;

      document.getElementById('profile-header').innerHTML =
        Components.renderProfileHeader(profileUser, currentUser.id, stats);

      // Edit profile button
      if (isOwnProfile) {
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
          editBtn.addEventListener('click', openEditModal);
        }
      }

    } catch (err) {
      Components.showToast(err.message, 'error');
      document.getElementById('profile-header').innerHTML =
        Components.renderEmptyState('👤', 'User not found');
    }
  }

  // ---------- Load Posts ----------
  async function loadPosts(append = false) {
    if (loading || (!hasMore && append)) return;
    loading = true;

    try {
      const data = await API.users.getPosts(userId, postOffset);
      const postsContainer = document.getElementById('profile-posts');
      const posts = data.posts || [];

      if (!append) {
        postsContainer.innerHTML = '';
      } else {
        const loadMoreEl = postsContainer.querySelector('.load-more-container');
        if (loadMoreEl) loadMoreEl.remove();
      }

      if (posts.length === 0 && !append) {
        postsContainer.innerHTML = Components.renderEmptyState(
          '📝',
          isOwnProfile ? 'You haven\'t posted yet' : 'No posts yet',
          isOwnProfile ? 'Share your first thought with the world!' : ''
        );
        hasMore = false;
      } else {
        posts.forEach(post => {
          postsContainer.insertAdjacentHTML('beforeend', Components.renderPostCard(post, currentUser.id));
        });

        postOffset += posts.length;

        if (posts.length >= LIMIT) {
          postsContainer.insertAdjacentHTML('beforeend', Components.renderLoadMoreButton());
          document.getElementById('load-more-btn').addEventListener('click', () => loadPosts(true));
        } else {
          hasMore = false;
        }
      }
    } catch (err) {
      Components.showToast(err.message, 'error');
    } finally {
      loading = false;
    }
  }

  // ---------- Edit Profile Modal ----------
  function openEditModal() {
    const modalContainer = document.getElementById('edit-modal');
    modalContainer.innerHTML = `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Edit Profile</h3>
            <button class="modal-close" id="modal-close">✕</button>
          </div>
          <div class="modal-body">
            <form id="edit-profile-form">
              <div class="form-group">
                <label for="edit-display-name">Display Name</label>
                <input type="text" id="edit-display-name" class="input-field" value="${Components.escapeHtml(profileUser.display_name || '')}" required>
              </div>
              <div class="form-group">
                <label for="edit-bio">Bio</label>
                <textarea id="edit-bio" class="textarea-field" rows="3" placeholder="Tell us about yourself">${Components.escapeHtml(profileUser.bio || '')}</textarea>
              </div>
              <div class="form-group">
                <label>Profile Photo</label>
                <div class="file-upload-area" id="avatar-upload-area">
                  <div class="icon">📷</div>
                  <p>Click or drag to upload a new photo</p>
                  <input type="file" id="edit-avatar" accept="image/*" style="display: none;">
                </div>
                <div class="image-preview-container" id="edit-avatar-preview-container">
                  <img src="" alt="Preview" class="image-preview" id="edit-avatar-preview">
                  <button type="button" class="image-preview-remove" id="edit-avatar-remove">✕</button>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="edit-save">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    let editAvatarFile = null;

    // Close handlers
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

    // Avatar upload
    const uploadArea = document.getElementById('avatar-upload-area');
    const avatarInput = document.getElementById('edit-avatar');
    const avatarPreviewContainer = document.getElementById('edit-avatar-preview-container');
    const avatarPreview = document.getElementById('edit-avatar-preview');

    uploadArea.addEventListener('click', () => avatarInput.click());
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleAvatarFile(file);
      }
    });

    avatarInput.addEventListener('change', (e) => {
      if (e.target.files[0]) handleAvatarFile(e.target.files[0]);
    });

    function handleAvatarFile(file) {
      editAvatarFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        avatarPreview.src = ev.target.result;
        avatarPreviewContainer.classList.add('active');
        uploadArea.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }

    document.getElementById('edit-avatar-remove').addEventListener('click', () => {
      editAvatarFile = null;
      avatarInput.value = '';
      avatarPreviewContainer.classList.remove('active');
      uploadArea.style.display = '';
    });

    // Save
    document.getElementById('edit-save').addEventListener('click', async () => {
      const display_name = document.getElementById('edit-display-name').value.trim();
      const bio = document.getElementById('edit-bio').value.trim();
      const saveBtn = document.getElementById('edit-save');

      if (!display_name) {
        Components.showToast('Display name is required', 'warning');
        return;
      }

      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;"></span>';

      try {
        const formData = new FormData();
        formData.append('display_name', display_name);
        formData.append('bio', bio);
        if (editAvatarFile) formData.append('avatar', editAvatarFile);

        const data = await API.users.update(formData);
        const updatedUser = data.user || data;

        // Update stored user
        API.setUser({ ...currentUser, ...updatedUser });

        Components.showToast('Profile updated!', 'success');
        closeModal();

        // Reload profile
        await loadProfile();
      } catch (err) {
        Components.showToast(err.message, 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    });
  }

  function closeModal() {
    document.getElementById('edit-modal').innerHTML = '';
  }

  // ---------- Init ----------
  loadProfile();
  loadPosts();

})();
