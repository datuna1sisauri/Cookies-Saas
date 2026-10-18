(function () {
    // Prevent running multiple times
    if (window.__cookieBannerInitialized) return;
    window.__cookieBannerInitialized = true;

    // Initialize Google Consent Mode v2 default state (Denied)
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('consent', 'default', {
      'analytics_storage': 'denied',
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied'
    });

    const STORAGE_KEY = 'saas_cookie_consent';
    const scriptEl = document.currentScript || document.querySelector('script[data-site-id]');
    const siteId = scriptEl && scriptEl.getAttribute('data-site-id');
    const apiOrigin = scriptEl && scriptEl.src ? new URL(scriptEl.src).origin : '';

    const DEFAULT_SETTINGS = {
      banner_text: 'We use cookies to enhance your experience and analyze site traffic in accordance with GDPR standards.',
      primary_color: '#2563eb',
      secondary_color: '#18181b',
      background_color: '#18181b',
      button_text: 'Accept All'
    };

    function safeColor(value, fallback) {
      return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
    }

    function applyConsent(granted) {
      if (granted) {
        // Update Google Consent Mode to Granted
        gtag('consent', 'update', {
          'analytics_storage': 'granted',
          'ad_storage': 'granted',
          'ad_user_data': 'granted',
          'ad_personalization': 'granted'
        });

        // Enable any blocked scripts tagged for analytics/marketing
        document.querySelectorAll('script[type="text/plain"][data-consent]').forEach(script => {
          const newScript = document.createElement('script');
          Array.from(script.attributes).forEach(attr => {
            if (attr.name !== 'type') newScript.setAttribute(attr.name, attr.value);
          });
          newScript.type = 'text/javascript';
          newScript.innerHTML = script.innerHTML;
          script.parentNode.replaceChild(newScript, script);
        });
      }
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, function (char) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
      });
    }

    function resolveSettings(raw) {
      const s = raw || {};
      const secondary = s.secondary_color || s.background_color || DEFAULT_SETTINGS.secondary_color;
      return {
        banner_text: s.banner_text || DEFAULT_SETTINGS.banner_text,
        primary_color: s.primary_color || DEFAULT_SETTINGS.primary_color,
        secondary_color: secondary,
        button_text: s.button_text || DEFAULT_SETTINGS.button_text
      };
    }

    function loadSettings() {
      if (!siteId || !apiOrigin) {
        return Promise.resolve(DEFAULT_SETTINGS);
      }

      return fetch(apiOrigin + '/api/banner-config?siteId=' + encodeURIComponent(siteId))
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) { return resolveSettings(data && data.settings); })
        .catch(function () { return DEFAULT_SETTINGS; });
    }

    function renderBanner(settings) {
      if (localStorage.getItem(STORAGE_KEY)) {
        const isGranted = localStorage.getItem(STORAGE_KEY) === 'granted';
        applyConsent(isGranted);
        return;
      }

      const primary = safeColor(settings.primary_color, DEFAULT_SETTINGS.primary_color);
      const secondary = safeColor(settings.secondary_color, DEFAULT_SETTINGS.secondary_color);

      // Inject CSS styles for the banner
      const style = document.createElement('style');
      style.innerHTML = `
        #cookie-banner-root {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          max-width: 500px;
          background: ${secondary};
          color: #f4f4f5;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          z-index: 999999;
        }
        #cookie-banner-root p { margin: 0 0 16px 0; line-height: 1.5; color: #a1a1aa; }
        .cb-buttons { display: flex; gap: 10px; }
        .cb-btn {
          flex: 1;
          padding: 10px 16px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          transition: opacity 0.2s;
        }
        .cb-btn:hover { opacity: 0.9; }
        .cb-btn-accept { background: ${primary}; color: #ffffff; }
        .cb-btn-reject { background: transparent; color: #f4f4f5; border: 1px solid ${primary}; }
      `;
      document.head.appendChild(style);

      // Create Banner HTML
      const banner = document.createElement('div');
      banner.id = 'cookie-banner-root';
      banner.innerHTML = `
        <p>${escapeHtml(settings.banner_text || DEFAULT_SETTINGS.banner_text)}</p>
        <div class="cb-buttons">
          <button class="cb-btn cb-btn-reject" id="cb-reject">Reject All</button>
          <button class="cb-btn cb-btn-accept" id="cb-accept">${escapeHtml(settings.button_text || DEFAULT_SETTINGS.button_text)}</button>
        </div>
      `;
      document.body.appendChild(banner);

      // Event Listeners
      document.getElementById('cb-accept').addEventListener('click', function () {
        localStorage.setItem(STORAGE_KEY, 'granted');
        applyConsent(true);
        banner.remove();
      });

      document.getElementById('cb-reject').addEventListener('click', function () {
        localStorage.setItem(STORAGE_KEY, 'denied');
        applyConsent(false);
        banner.remove();
      });
    }

    function start() {
      loadSettings().then(renderBanner);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  })();
