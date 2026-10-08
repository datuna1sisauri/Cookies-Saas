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
  
    function renderBanner() {
      if (localStorage.getItem(STORAGE_KEY)) {
        const isGranted = localStorage.getItem(STORAGE_KEY) === 'granted';
        applyConsent(isGranted);
        return;
      }
  
      // Inject CSS styles for the banner
      const style = document.createElement('style');
      style.innerHTML = `
        #cookie-banner-root {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          max-width: 500px;
          background: #18181b;
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
        .cb-btn-accept { background: #2563eb; color: #ffffff; }
        .cb-btn-reject { background: #27272a; color: #f4f4f5; border: 1px solid #3f3f46; }
      `;
      document.head.appendChild(style);
  
      // Create Banner HTML
      const banner = document.createElement('div');
      banner.id = 'cookie-banner-root';
      banner.innerHTML = `
        <p>We use cookies to enhance your experience and analyze site traffic in accordance with GDPR standards.</p>
        <div class="cb-buttons">
          <button class="cb-btn cb-btn-reject" id="cb-reject">Reject All</button>
          <button class="cb-btn cb-btn-accept" id="cb-accept">Accept All</button>
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
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderBanner);
    } else {
      renderBanner();
    }
  })();