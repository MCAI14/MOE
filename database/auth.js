// Simple client-side password guard for the /database section.
// This is not a substitute for a real server-side auth system, but it provides
// a layer of protection when hosting on static providers like Netlify.

(function () {
  const STORAGE_KEY = 'databaseAuth';
  const PASSWORD = 'USCAML2420Y';

  function isValidPassword(value) {
    return value === PASSWORD;
  }

  function isAuthenticated() {
    return localStorage.getItem(STORAGE_KEY) === '1';
  }

  function setAuthenticated() {
    localStorage.setItem(STORAGE_KEY, '1');
  }

  function clearAuth() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function buildOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'database-auth-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.85)';
    overlay.style.color = 'white';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.padding = '1rem';
    overlay.style.zIndex = '9999';

    const box = document.createElement('div');
    box.style.maxWidth = '420px';
    box.style.width = '100%';
    box.style.background = 'rgba(255,255,255,0.1)';
    box.style.border = '1px solid rgba(255,255,255,0.25)';
    box.style.borderRadius = '12px';
    box.style.padding = '1.5rem';
    box.style.backdropFilter = 'blur(10px)';
    box.style.textAlign = 'center';

    const title = document.createElement('h2');
    title.textContent = 'Protected Area';
    title.style.margin = '0 0 0.75rem';

    const info = document.createElement('p');
    info.textContent = 'Please enter the password to view this section.';
    info.style.margin = '0 0 1rem';

    const input = document.createElement('input');
    input.type = 'password';
    input.placeholder = 'Password';
    input.style.width = '100%';
    input.style.padding = '0.75rem';
    input.style.border = '1px solid rgba(255,255,255,0.35)';
    input.style.borderRadius = '6px';
    input.style.background = 'rgba(0,0,0,0.3)';
    input.style.color = 'white';
    input.style.marginBottom = '1rem';

    const error = document.createElement('div');
    error.style.color = '#ffb3b3';
    error.style.minHeight = '1.25rem';
    error.style.marginBottom = '0.75rem';
    error.style.fontSize = '0.95rem';

    const button = document.createElement('button');
    button.textContent = 'Unlock';
    button.style.padding = '0.75rem 1rem';
    button.style.border = 'none';
    button.style.borderRadius = '6px';
    button.style.background = '#4f9dff';
    button.style.color = 'white';
    button.style.fontSize = '1rem';
    button.style.cursor = 'pointer';

    button.addEventListener('click', () => {
      const value = input.value.trim();
      if (!isValidPassword(value)) {
        error.textContent = 'Password incorrect. Try again.';
        input.value = '';
        input.focus();
        return;
      }
      setAuthenticated();
      document.body.removeChild(overlay);
      if (window.__databaseAuthResolve) {
        window.__databaseAuthResolve();
      }
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        button.click();
      }
    });

    const logoutLink = document.createElement('a');
    logoutLink.textContent = 'Clear password / logout';
    logoutLink.href = '#';
    logoutLink.style.display = 'block';
    logoutLink.style.marginTop = '1rem';
    logoutLink.style.fontSize = '0.9rem';
    logoutLink.style.color = 'rgba(255,255,255,0.85)';

    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      clearAuth();
      location.reload();
    });

    box.appendChild(title);
    box.appendChild(info);
    box.appendChild(input);
    box.appendChild(error);
    box.appendChild(button);
    box.appendChild(logoutLink);
    overlay.appendChild(box);
    return overlay;
  }

  window.requireDatabaseAuth = function () {
    if (isAuthenticated()) {
      return Promise.resolve();
    }

    if (document.getElementById('database-auth-overlay')) {
      // already shown
      return new Promise((resolve) => {
        window.__databaseAuthResolve = resolve;
      });
    }

    const overlay = buildOverlay();
    document.body.appendChild(overlay);
    return new Promise((resolve) => {
      window.__databaseAuthResolve = resolve;
    });
  };

  window.logoutDatabaseAuth = function () {
    clearAuth();
    location.reload();
  };
})();
