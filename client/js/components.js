/* ============================================
   VIBE — Reusable UI Components
   ============================================ */

(function () {

  /* ---------- Helpers ---------- */

  function getAvatarUrl(user) {
    if (!user) return '/assets/default-avatar.svg';
    if (user.avatar_url) return user.avatar_url;
    return '/assets/default-avatar.svg';
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatTime(dateString) {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  }

  /* ---------- Toast ---------- */

  function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /* ---------- Navbar ---------- */

  function renderNavbar(activePage) {
    const user = API.getUser();
    if (!user) return '';

    return `
      <nav class="navbar">
        <div class="navbar-inner">
          <a href="/feed.html" class="navbar-logo">Vibe</a>
          <ul class="navbar-nav">
            <li><a href="/feed.html" class="nav-link ${activePage === 'feed' ? 'active' : ''}">
              <span>🏠</span> <span class="nav-text">Feed</span>
            </a></li>
            <li><a href="/explore.html" class="nav-link ${activePage === 'explore' ? 'active' : ''}">
              <span>🔍</span> <span class="nav-text">Explore</span>
            </a></li>
          </ul>
          <div class="navbar-user">
            <a href="/profile.html?id=${user.id}" class="navbar-user-info">
              <img src="${getAvatarUrl(user)}" alt="Avatar" class="avatar avatar--sm" onerror="this.src='/assets/default-avatar.svg'">
              <span class="navbar-username">${escapeHtml(user.display_name || user.username)}</span>
            </a>
            <button class="btn-icon" id="logout-btn" title="Logout">↩</button>
          </div>
        </div>
      </nav>
    `;
  }

  /* ---------- Post Card ---------- */

  function renderPostCard(post, currentUserId) {
    const isLiked = post.is_liked;
    const isOwn = post.user_id === currentUserId;

    return `
      <article class="glass-card post-card fade-in" data-post-id="${post.id}">
        <div class="post-header">
          <a href="/profile.html?id=${post.user_id}">
            <img src="${getAvatarUrl(post)}" alt="" class="avatar avatar--md" onerror="this.src='/assets/default-avatar.svg'">
          </a>
          <div class="post-author-info">
            <a href="/profile.html?id=${post.user_id}" class="post-author-name">${escapeHtml(post.display_name || post.username)}</a>
            <div>
              <span class="post-author-username">@${escapeHtml(post.username)}</span>
              <span class="post-time"> · ${formatTime(post.created_at)}</span>
            </div>
          </div>
        </div>
        ${post.content ? `<div class="post-content">${escapeHtml(post.content)}</div>` : ''}
        ${post.image_url ? `<img src="${post.image_url}" alt="Post image" class="post-image" loading="lazy" onerror="this.style.display='none'">` : ''}
        <div class="post-actions">
          <button class="post-action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
            <span class="icon">${isLiked ? '♥' : '♡'}</span>
            <span class="like-count">${post.like_count || 0}</span>
          </button>
          <button class="post-action-btn comment-toggle-btn" data-post-id="${post.id}">
            <span class="icon">💬</span>
            <span class="comment-count">${post.comment_count || 0}</span>
          </button>
          ${isOwn ? `
            <button class="post-action-btn post-action-btn--delete delete-post-btn" data-post-id="${post.id}" title="Delete post">
              <span class="icon">🗑</span>
            </button>
          ` : ''}
        </div>
        <div class="comments-section" id="comments-${post.id}">
          <div class="comments-list" id="comments-list-${post.id}">
            <div class="empty-state" style="padding: 16px;">
              <div class="spinner" style="margin: 0 auto;"></div>
            </div>
          </div>
          <form class="comment-form" data-post-id="${post.id}">
            <input type="text" class="input-field" placeholder="Write a comment..." required>
            <button type="submit" class="btn btn-primary btn-sm">➤</button>
          </form>
        </div>
      </article>
    `;
  }

  /* ---------- Comment ---------- */

  function renderComment(comment, currentUserId) {
    const isOwn = comment.user_id === currentUserId;
    return `
      <div class="comment-item fade-in" data-comment-id="${comment.id}">
        <a href="/profile.html?id=${comment.user_id}">
          <img src="${getAvatarUrl(comment)}" alt="" class="avatar avatar--sm" onerror="this.src='/assets/default-avatar.svg'">
        </a>
        <div class="comment-body">
          <a href="/profile.html?id=${comment.user_id}" class="comment-author">${escapeHtml(comment.display_name || comment.username)}</a>
          <div class="comment-text">${escapeHtml(comment.content)}</div>
          <div class="comment-time">${formatTime(comment.created_at)}</div>
        </div>
        ${isOwn ? `<button class="comment-delete-btn delete-comment-btn" data-comment-id="${comment.id}" title="Delete">🗑</button>` : ''}
      </div>
    `;
  }

  /* ---------- User Card ---------- */

  function renderUserCard(user, currentUserId) {
    const isOwn = user.id === currentUserId;
    return `
      <div class="user-card fade-in" data-user-id="${user.id}">
        <a href="/profile.html?id=${user.id}">
          <img src="${getAvatarUrl(user)}" alt="" class="avatar avatar--md" onerror="this.src='/assets/default-avatar.svg'">
        </a>
        <div class="user-card-info">
          <a href="/profile.html?id=${user.id}" class="user-card-name">${escapeHtml(user.display_name || user.username)}</a>
          <div class="user-card-username">@${escapeHtml(user.username)}</div>
          ${user.bio ? `<div class="user-card-bio">${escapeHtml(user.bio)}</div>` : ''}
        </div>
        ${!isOwn ? `
          <button class="btn btn-sm ${user.is_following ? 'btn-secondary' : 'btn-primary'} follow-btn" data-user-id="${user.id}" data-following="${user.is_following ? 'true' : 'false'}">
            ${user.is_following ? 'Following' : 'Follow'}
          </button>
        ` : ''}
      </div>
    `;
  }

  /* ---------- Post Composer ---------- */

  function renderPostComposer(currentUser) {
    return `
      <div class="glass-card--static post-composer">
        <div class="composer-top">
          <img src="${getAvatarUrl(currentUser)}" alt="" class="avatar avatar--md" onerror="this.src='/assets/default-avatar.svg'">
          <textarea class="textarea-field" id="composer-text" placeholder="What's on your mind?" rows="2"></textarea>
        </div>
        <div class="image-preview-container" id="image-preview-container">
          <img src="" alt="Preview" class="image-preview" id="image-preview">
          <button type="button" class="image-preview-remove" id="image-preview-remove">✕</button>
        </div>
        <div class="composer-bottom">
          <div class="composer-actions">
            <label class="btn-icon" title="Add image" style="cursor: pointer;">
              📷
              <input type="file" id="composer-image" accept="image/*" style="display: none;">
            </label>
          </div>
          <button class="btn btn-primary" id="composer-submit">Post</button>
        </div>
      </div>
    `;
  }

  /* ---------- Profile Header ---------- */

  function renderProfileHeader(user, currentUserId, stats) {
    const isOwn = user.id === currentUserId;
    return `
      <div class="profile-header fade-in">
        <div class="profile-banner"></div>
        <div class="profile-info">
          <img src="${getAvatarUrl(user)}" alt="" class="avatar avatar--xl" onerror="this.src='/assets/default-avatar.svg'">
          <h1 class="profile-display-name">${escapeHtml(user.display_name || user.username)}</h1>
          <div class="profile-username">@${escapeHtml(user.username)}</div>
          ${user.bio ? `<p class="profile-bio">${escapeHtml(user.bio)}</p>` : ''}
          <div class="profile-stats">
            <div class="profile-stat">
              <span class="profile-stat-number">${stats.post_count || 0}</span>
              <span class="profile-stat-label">Posts</span>
            </div>
            <div class="profile-stat">
              <span class="profile-stat-number">${stats.follower_count || 0}</span>
              <span class="profile-stat-label">Followers</span>
            </div>
            <div class="profile-stat">
              <span class="profile-stat-number">${stats.following_count || 0}</span>
              <span class="profile-stat-label">Following</span>
            </div>
          </div>
          <div class="profile-actions">
            ${isOwn
              ? `<button class="btn btn-secondary" id="edit-profile-btn">Edit Profile</button>`
              : `<button class="btn ${user.is_following ? 'btn-secondary' : 'btn-primary'} follow-btn" data-user-id="${user.id}" data-following="${user.is_following ? 'true' : 'false'}">
                  ${user.is_following ? 'Following' : 'Follow'}
                </button>`
            }
          </div>
        </div>
      </div>
    `;
  }

  /* ---------- Sidebar ---------- */

  function renderSidebar(currentUser, activePage) {
    return `
      <div class="glass-card--static sidebar-profile">
        <a href="/profile.html?id=${currentUser.id}">
          <img src="${getAvatarUrl(currentUser)}" alt="" class="avatar avatar--lg" onerror="this.src='/assets/default-avatar.svg'">
        </a>
        <div class="sidebar-profile-name">${escapeHtml(currentUser.display_name || currentUser.username)}</div>
        <div class="sidebar-profile-username">@${escapeHtml(currentUser.username)}</div>
      </div>
      <nav class="glass-card--static" style="padding: 8px 0;">
        <ul class="sidebar-nav">
          <li class="sidebar-nav-item"><a href="/feed.html" class="${activePage === 'feed' ? 'active' : ''}"><span>🏠</span> Feed</a></li>
          <li class="sidebar-nav-item"><a href="/explore.html" class="${activePage === 'explore' ? 'active' : ''}"><span>🔍</span> Explore</a></li>
          <li class="sidebar-nav-item"><a href="/profile.html?id=${currentUser.id}"><span>👤</span> Profile</a></li>
        </ul>
      </nav>
    `;
  }

  /* ---------- Suggested Users ---------- */

  function renderSuggestedUsers(users, currentUserId) {
    if (!users || users.length === 0) return '';
    const userCards = users
      .filter(u => u.id !== currentUserId)
      .slice(0, 5)
      .map(u => renderUserCard(u, currentUserId))
      .join('');

    return `
      <div class="glass-card--static" style="padding: 16px;">
        <div class="sidebar-section-title" style="padding: 0 0 12px;">Suggested for you</div>
        ${userCards || '<p style="color: var(--text-muted); font-size: 0.85rem; padding: 8px;">No suggestions yet</p>'}
      </div>
    `;
  }

  /* ---------- Empty State ---------- */

  function renderEmptyState(icon, message, sub) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${icon}</div>
        <div class="empty-state-message">${escapeHtml(message)}</div>
        ${sub ? `<div class="empty-state-sub">${escapeHtml(sub)}</div>` : ''}
      </div>
    `;
  }

  /* ---------- Load More ---------- */

  function renderLoadMoreButton() {
    return `
      <div class="load-more-container">
        <button class="load-more-btn" id="load-more-btn">Load More</button>
      </div>
    `;
  }

  /* ---------- Skeleton Loader ---------- */

  function renderPostSkeleton(count = 3) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="glass-card post-card" style="pointer-events:none;">
          <div class="post-header">
            <div class="skeleton skeleton--avatar"></div>
            <div style="flex:1;">
              <div class="skeleton skeleton--text" style="width:40%;"></div>
              <div class="skeleton skeleton--text-sm" style="width:25%;"></div>
            </div>
          </div>
          <div class="skeleton skeleton--text" style="width:90%;"></div>
          <div class="skeleton skeleton--text" style="width:70%;"></div>
          <div class="skeleton skeleton--text" style="width:50%;"></div>
        </div>
      `;
    }
    return html;
  }

  /* ---------- Event Listeners (Delegation) ---------- */

  function initializeEventListeners() {
    document.body.addEventListener('click', async (e) => {
      // Logout
      const logoutBtn = e.target.closest('#logout-btn');
      if (logoutBtn) {
        e.preventDefault();
        API.logout();
        return;
      }

      // Like / Unlike
      const likeBtn = e.target.closest('.like-btn');
      if (likeBtn) {
        e.preventDefault();
        const postId = likeBtn.dataset.postId;
        const isLiked = likeBtn.classList.contains('liked');
        const countEl = likeBtn.querySelector('.like-count');
        const iconEl = likeBtn.querySelector('.icon');
        let count = parseInt(countEl.textContent) || 0;

        try {
          if (isLiked) {
            await API.likes.unlike(postId);
            likeBtn.classList.remove('liked');
            iconEl.textContent = '♡';
            countEl.textContent = Math.max(0, count - 1);
          } else {
            await API.likes.like(postId);
            likeBtn.classList.add('liked');
            iconEl.textContent = '♥';
            countEl.textContent = count + 1;
            // Re-trigger animation
            iconEl.style.animation = 'none';
            iconEl.offsetHeight; // reflow
            iconEl.style.animation = '';
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
        return;
      }

      // Comment toggle
      const commentToggle = e.target.closest('.comment-toggle-btn');
      if (commentToggle) {
        e.preventDefault();
        const postId = commentToggle.dataset.postId;
        const section = document.getElementById(`comments-${postId}`);
        if (section) {
          const isOpen = section.classList.contains('open');
          if (isOpen) {
            section.classList.remove('open');
          } else {
            section.classList.add('open');
            // Load comments
            try {
              const data = await API.comments.getByPost(postId);
              const list = document.getElementById(`comments-list-${postId}`);
              const currentUser = API.getUser();
              if (data.comments && data.comments.length > 0) {
                list.innerHTML = data.comments.map(c => renderComment(c, currentUser ? currentUser.id : null)).join('');
              } else {
                list.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; padding: 12px; text-align: center;">No comments yet. Be the first!</p>';
              }
            } catch (err) {
              showToast(err.message, 'error');
            }
          }
        }
        return;
      }

      // Delete post
      const deletePostBtn = e.target.closest('.delete-post-btn');
      if (deletePostBtn) {
        e.preventDefault();
        const postId = deletePostBtn.dataset.postId;
        if (confirm('Are you sure you want to delete this post?')) {
          try {
            await API.posts.delete(postId);
            const card = document.querySelector(`.post-card[data-post-id="${postId}"]`);
            if (card) {
              card.style.transition = 'all 0.3s ease';
              card.style.opacity = '0';
              card.style.transform = 'scale(0.95)';
              setTimeout(() => card.remove(), 300);
            }
            showToast('Post deleted', 'success');
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
        return;
      }

      // Delete comment
      const deleteCommentBtn = e.target.closest('.delete-comment-btn');
      if (deleteCommentBtn) {
        e.preventDefault();
        const commentId = deleteCommentBtn.dataset.commentId;
        try {
          await API.comments.delete(commentId);
          const commentEl = document.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
          if (commentEl) {
            commentEl.style.transition = 'all 0.3s ease';
            commentEl.style.opacity = '0';
            setTimeout(() => commentEl.remove(), 300);
          }
          showToast('Comment deleted', 'success');
        } catch (err) {
          showToast(err.message, 'error');
        }
        return;
      }

      // Follow / Unfollow
      const followBtn = e.target.closest('.follow-btn');
      if (followBtn) {
        e.preventDefault();
        const userId = followBtn.dataset.userId;
        const isFollowing = followBtn.dataset.following === 'true';

        try {
          if (isFollowing) {
            await API.follows.unfollow(userId);
            followBtn.dataset.following = 'false';
            followBtn.textContent = 'Follow';
            followBtn.className = followBtn.className.replace('btn-secondary', 'btn-primary');
            showToast('Unfollowed', 'info');
          } else {
            await API.follows.follow(userId);
            followBtn.dataset.following = 'true';
            followBtn.textContent = 'Following';
            followBtn.className = followBtn.className.replace('btn-primary', 'btn-secondary');
            showToast('Following!', 'success');
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
        return;
      }
    });

    // Comment form submission
    document.body.addEventListener('submit', async (e) => {
      const commentForm = e.target.closest('.comment-form');
      if (commentForm) {
        e.preventDefault();
        const postId = commentForm.dataset.postId;
        const input = commentForm.querySelector('.input-field');
        const content = input.value.trim();
        if (!content) return;

        const submitBtn = commentForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
          const data = await API.comments.create(postId, content);
          input.value = '';
          // Prepend the new comment
          const list = document.getElementById(`comments-list-${postId}`);
          const currentUser = API.getUser();
          const newComment = data.comment || { ...data, user_id: currentUser.id, username: currentUser.username, display_name: currentUser.display_name, avatar_url: currentUser.avatar_url, content, created_at: new Date().toISOString() };
          const emptyMsg = list.querySelector('p');
          if (emptyMsg) emptyMsg.remove();
          list.insertAdjacentHTML('afterbegin', renderComment(newComment, currentUser.id));

          // Update count
          const countEl = document.querySelector(`.comment-toggle-btn[data-post-id="${postId}"] .comment-count`);
          if (countEl) countEl.textContent = parseInt(countEl.textContent || '0') + 1;
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          submitBtn.disabled = false;
        }
      }
    });
  }

  /* ---------- Expose Globally ---------- */

  window.Components = {
    showToast,
    renderNavbar,
    renderPostCard,
    renderComment,
    renderUserCard,
    renderPostComposer,
    renderProfileHeader,
    renderSidebar,
    renderSuggestedUsers,
    renderEmptyState,
    renderLoadMoreButton,
    renderPostSkeleton,
    formatTime,
    getAvatarUrl,
    escapeHtml,
    initializeEventListeners,
  };

})();
