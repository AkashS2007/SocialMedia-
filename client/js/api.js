/* ============================================
   VIBE — API Client Module
   ============================================ */

(function () {
  const API_BASE = '/api';

  function getToken() { return localStorage.getItem('token'); }
  function setToken(token) { localStorage.setItem('token', token); }
  function removeToken() { localStorage.removeItem('token'); }
  function getUser() {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  }
  function setUser(user) { localStorage.setItem('user', JSON.stringify(user)); }
  function removeUser() { localStorage.removeItem('user'); }
  function isLoggedIn() { return !!getToken(); }
  function logout() { removeToken(); removeUser(); window.location.href = '/'; }

  async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = { ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      if (response.status === 401) { logout(); return; }
      throw new Error(data.error || data.message || 'Something went wrong');
    }
    return data;
  }

  // Auth
  const auth = {
    register: (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  };

  // Users
  const users = {
    me: () => apiRequest('/users/me'),
    getById: (id) => apiRequest(`/users/${id}`),
    update: (formData) => apiRequest('/users/me', { method: 'PUT', body: formData }),
    search: (q) => apiRequest(`/users/search?q=${encodeURIComponent(q)}`),
    getPosts: (id, offset = 0) => apiRequest(`/users/${id}/posts?offset=${offset}`),
  };

  // Posts
  const posts = {
    create: (formData) => apiRequest('/posts', { method: 'POST', body: formData }),
    getFeed: (offset = 0) => apiRequest(`/posts/feed?offset=${offset}`),
    getExplore: (offset = 0) => apiRequest(`/posts/explore?offset=${offset}`),
    getById: (id) => apiRequest(`/posts/${id}`),
    delete: (id) => apiRequest(`/posts/${id}`, { method: 'DELETE' }),
  };

  // Comments
  const comments = {
    getByPost: (postId) => apiRequest(`/posts/${postId}/comments`),
    create: (postId, content) => apiRequest(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
    delete: (id) => apiRequest(`/comments/${id}`, { method: 'DELETE' }),
  };

  // Likes
  const likes = {
    like: (postId) => apiRequest(`/posts/${postId}/like`, { method: 'POST' }),
    unlike: (postId) => apiRequest(`/posts/${postId}/like`, { method: 'DELETE' }),
  };

  // Follows
  const follows = {
    follow: (userId) => apiRequest(`/users/${userId}/follow`, { method: 'POST' }),
    unfollow: (userId) => apiRequest(`/users/${userId}/follow`, { method: 'DELETE' }),
    getFollowers: (userId) => apiRequest(`/users/${userId}/followers`),
    getFollowing: (userId) => apiRequest(`/users/${userId}/following`),
  };

  // Expose globally
  window.API = {
    getToken, setToken, removeToken,
    getUser, setUser, removeUser,
    isLoggedIn, logout,
    apiRequest,
    auth, users, posts, comments, likes, follows,
  };
})();
