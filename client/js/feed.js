/* ============================================
   VIBE — Feed Page Logic
   ============================================ */

(function () {
  // Auth guard
  if (!API.isLoggedIn()) {
    window.location.href = '/';
    return;
  }

  const currentUser = API.getUser();
  let feedOffset = 0;
  const LIMIT = 10;
  let hasMore = true;
  let loading = false;

  // Render navbar
  document.getElementById('navbar').innerHTML = Components.renderNavbar('feed');

  // Render sidebar
  document.getElementById('sidebar-left').innerHTML = Components.renderSidebar(currentUser, 'feed');

  // Initialize main content with composer + skeleton
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = Components.renderPostComposer(currentUser) +
    '<div id="feed-posts">' + Components.renderPostSkeleton(3) + '</div>';

  // Initialize event listeners
  Components.initializeEventListeners();

  // ---------- Load Feed ----------
  async function loadFeed(append = false) {
    if (loading || (!hasMore && append)) return;
    loading = true;

    try {
      const data = await API.posts.getFeed(feedOffset);
      const postsContainer = document.getElementById('feed-posts');
      const posts = data.posts || [];

      if (!append) {
        postsContainer.innerHTML = '';
      } else {
        // Remove load more button
        const loadMoreEl = postsContainer.querySelector('.load-more-container');
        if (loadMoreEl) loadMoreEl.remove();
      }

      if (posts.length === 0 && !append) {
        postsContainer.innerHTML = Components.renderEmptyState(
          '📝',
          'Your feed is empty',
          'Follow people to see their posts here, or explore trending content.'
        );
        hasMore = false;
      } else {
        posts.forEach(post => {
          postsContainer.insertAdjacentHTML('beforeend', Components.renderPostCard(post, currentUser.id));
        });

        feedOffset += posts.length;

        if (posts.length >= LIMIT) {
          postsContainer.insertAdjacentHTML('beforeend', Components.renderLoadMoreButton());
          document.getElementById('load-more-btn').addEventListener('click', () => loadFeed(true));
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

  loadFeed();

  // ---------- Post Composer ----------
  const composerText = document.getElementById('composer-text');
  const composerImage = document.getElementById('composer-image');
  const composerSubmit = document.getElementById('composer-submit');
  const imagePreviewContainer = document.getElementById('image-preview-container');
  const imagePreview = document.getElementById('image-preview');
  const imagePreviewRemove = document.getElementById('image-preview-remove');

  let selectedFile = null;

  composerImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      selectedFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        imagePreview.src = ev.target.result;
        imagePreviewContainer.classList.add('active');
      };
      reader.readAsDataURL(file);
    }
  });

  imagePreviewRemove.addEventListener('click', () => {
    selectedFile = null;
    composerImage.value = '';
    imagePreview.src = '';
    imagePreviewContainer.classList.remove('active');
  });

  composerSubmit.addEventListener('click', async () => {
    const content = composerText.value.trim();
    if (!content && !selectedFile) {
      Components.showToast('Write something or add an image', 'warning');
      return;
    }

    composerSubmit.disabled = true;
    composerSubmit.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;"></span>';

    try {
      const formData = new FormData();
      if (content) formData.append('content', content);
      if (selectedFile) formData.append('image', selectedFile);

      const data = await API.posts.create(formData);
      const newPost = data.post || data;

      // Prepend post to feed
      const postsContainer = document.getElementById('feed-posts');
      const emptyState = postsContainer.querySelector('.empty-state');
      if (emptyState) postsContainer.innerHTML = '';

      // Construct post object with user info for rendering
      const postForRender = {
        ...newPost,
        username: currentUser.username,
        display_name: currentUser.display_name,
        avatar_url: currentUser.avatar_url,
        like_count: 0,
        comment_count: 0,
        is_liked: false,
      };
      postsContainer.insertAdjacentHTML('afterbegin', Components.renderPostCard(postForRender, currentUser.id));

      // Reset composer
      composerText.value = '';
      selectedFile = null;
      composerImage.value = '';
      imagePreview.src = '';
      imagePreviewContainer.classList.remove('active');

      Components.showToast('Post published!', 'success');
    } catch (err) {
      Components.showToast(err.message, 'error');
    } finally {
      composerSubmit.disabled = false;
      composerSubmit.textContent = 'Post';
    }
  });

  // ---------- Suggested Users ----------
  async function loadSuggested() {
    try {
      const data = await API.users.search('');
      const users = data.users || data || [];
      document.getElementById('sidebar-right').innerHTML = Components.renderSuggestedUsers(users, currentUser.id);
    } catch (err) {
      // Silent fail for suggested users
    }
  }

  loadSuggested();

  // ---------- Refresh user data ----------
  async function refreshUser() {
    try {
      const data = await API.users.me();
      if (data.user || data) {
        const user = data.user || data;
        API.setUser(user);
      }
    } catch (err) {
      // Silent fail
    }
  }

  refreshUser();

})();
