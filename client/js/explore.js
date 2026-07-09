/* ============================================
   VIBE — Explore Page Logic
   ============================================ */

(function () {
  // Auth guard
  if (!API.isLoggedIn()) {
    window.location.href = '/';
    return;
  }

  const currentUser = API.getUser();
  let exploreOffset = 0;
  const LIMIT = 10;
  let hasMore = true;
  let loading = false;
  let searchDebounceTimer = null;

  // Render navbar
  document.getElementById('navbar').innerHTML = Components.renderNavbar('explore');

  // Render sidebar
  document.getElementById('sidebar-left').innerHTML = Components.renderSidebar(currentUser, 'explore');

  // Initialize main content
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = `
    <div class="search-bar">
      <span class="search-bar-icon">🔍</span>
      <input type="text" class="input-field" id="search-input" placeholder="Search people...">
    </div>
    <div id="search-results" style="display: none; margin-bottom: 24px;"></div>
    <div class="tab-bar">
      <button class="tab-item active" data-tab="trending">Trending</button>
      <button class="tab-item" data-tab="recent">Recent</button>
    </div>
    <div id="explore-posts">${Components.renderPostSkeleton(3)}</div>
  `;

  // Initialize event listeners
  Components.initializeEventListeners();

  // ---------- Search ----------
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    const query = searchInput.value.trim();

    if (!query) {
      searchResults.style.display = 'none';
      searchResults.innerHTML = '';
      return;
    }

    searchDebounceTimer = setTimeout(async () => {
      try {
        const data = await API.users.search(query);
        const users = data.users || data || [];
        searchResults.style.display = 'block';

        if (users.length === 0) {
          searchResults.innerHTML = `
            <div class="glass-card--static" style="padding: 16px;">
              <div class="sidebar-section-title" style="padding: 0 0 12px;">Search Results</div>
              <p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 16px;">No users found for "${Components.escapeHtml(query)}"</p>
            </div>
          `;
        } else {
          searchResults.innerHTML = `
            <div class="glass-card--static" style="padding: 16px;">
              <div class="sidebar-section-title" style="padding: 0 0 12px;">Search Results (${users.length})</div>
              <div class="stagger-children">
                ${users.map(u => Components.renderUserCard(u, currentUser.id)).join('')}
              </div>
            </div>
          `;
        }
      } catch (err) {
        Components.showToast(err.message, 'error');
      }
    }, 300);
  });

  // ---------- Tabs ----------
  document.querySelectorAll('.tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // Reset and reload
      exploreOffset = 0;
      hasMore = true;
      loadExplore();
    });
  });

  // ---------- Load Explore Posts ----------
  async function loadExplore(append = false) {
    if (loading || (!hasMore && append)) return;
    loading = true;

    try {
      const data = await API.posts.getExplore(exploreOffset);
      const postsContainer = document.getElementById('explore-posts');
      const posts = data.posts || [];

      if (!append) {
        postsContainer.innerHTML = '';
      } else {
        const loadMoreEl = postsContainer.querySelector('.load-more-container');
        if (loadMoreEl) loadMoreEl.remove();
      }

      if (posts.length === 0 && !append) {
        postsContainer.innerHTML = Components.renderEmptyState(
          '🌍',
          'Nothing to explore yet',
          'Be the first to post something!'
        );
        hasMore = false;
      } else {
        posts.forEach(post => {
          postsContainer.insertAdjacentHTML('beforeend', Components.renderPostCard(post, currentUser.id));
        });

        exploreOffset += posts.length;

        if (posts.length >= LIMIT) {
          postsContainer.insertAdjacentHTML('beforeend', Components.renderLoadMoreButton());
          document.getElementById('load-more-btn').addEventListener('click', () => loadExplore(true));
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

  loadExplore();

  // ---------- Suggested Users (sidebar) ----------
  async function loadSuggested() {
    try {
      const data = await API.users.search('');
      const users = data.users || data || [];
      document.getElementById('sidebar-right').innerHTML = Components.renderSuggestedUsers(users, currentUser.id);
    } catch (err) {
      // Silent fail
    }
  }

  loadSuggested();

})();
