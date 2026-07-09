/* ============================================
   VIBE — Auth Page Logic
   ============================================ */

(function () {
  // Redirect if already logged in
  if (API.isLoggedIn()) {
    window.location.href = '/feed.html';
    return;
  }

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegisterLink = document.getElementById('show-register');
  const showLoginLink = document.getElementById('show-login');

  // Toggle forms
  showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
  });

  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
  });

  // Clear error
  function clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
      el.textContent = '';
      el.classList.remove('visible');
    });
    document.querySelectorAll('.input-field.error').forEach(el => {
      el.classList.remove('error');
    });
  }

  function showFieldError(fieldId, message) {
    const errorEl = document.getElementById(fieldId + '-error');
    const inputEl = document.getElementById(fieldId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
    if (inputEl) inputEl.classList.add('error');
  }

  // Login
  document.getElementById('login-submit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');

    // Validate
    if (!email) { showFieldError('login-email', 'Email is required'); return; }
    if (!password) { showFieldError('login-password', 'Password is required'); return; }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;"></span> Signing in...';

    try {
      const data = await API.auth.login({ email, password });
      API.setToken(data.token);
      API.setUser(data.user);
      window.location.href = '/feed.html';
    } catch (err) {
      // Show toast for general error
      if (window.Components) {
        Components.showToast(err.message, 'error');
      } else {
        alert(err.message);
      }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });

  // Register
  document.getElementById('register-submit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const display_name = document.getElementById('reg-display-name').value.trim();
    const password = document.getElementById('reg-password').value;
    const btn = document.getElementById('register-btn');

    // Validate
    let valid = true;
    if (!username || username.length < 3) { showFieldError('reg-username', 'Username must be at least 3 characters'); valid = false; }
    if (!email) { showFieldError('reg-email', 'Email is required'); valid = false; }
    if (!display_name) { showFieldError('reg-display-name', 'Display name is required'); valid = false; }
    if (!password || password.length < 6) { showFieldError('reg-password', 'Password must be at least 6 characters'); valid = false; }
    if (!valid) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;"></span> Creating account...';

    try {
      const data = await API.auth.register({ username, email, display_name, password });
      API.setToken(data.token);
      API.setUser(data.user);
      window.location.href = '/feed.html';
    } catch (err) {
      if (window.Components) {
        Components.showToast(err.message, 'error');
      } else {
        alert(err.message);
      }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });

  // Focus effects
  document.querySelectorAll('.input-field').forEach(input => {
    input.addEventListener('focus', () => {
      input.classList.remove('error');
      const errorEl = document.getElementById(input.id + '-error');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
      }
    });
  });
})();
