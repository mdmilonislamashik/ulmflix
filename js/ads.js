(function () {
  'use strict';

  const cfg = window.ULMFLIX_CONFIG || {};
  const publisherId = String(cfg.ADSENSE_PUBLISHER_ID || '').trim();

  function isConfigured() {
    return /^ca-pub-\d{16}$/.test(publisherId);
  }

  function renderPlaceholders() {
    document.querySelectorAll('[data-ad-slot]').forEach(slot => {
      if (slot.dataset.adsRendered === '1') return;
      slot.dataset.adsRendered = '1';
      if (isConfigured() && cfg.ADSENSE_ENABLED === true) {
        slot.innerHTML = '<div class="ad-placeholder"><span>Advertisement</span></div>';
      } else {
        slot.innerHTML = '<div class="ad-placeholder"><span>Advertisement</span><small>AdSense is ready to be connected after your publisher ID is added and the site is approved.</small></div>';
      }
    });
  }

  function loadScript() {
    if (!isConfigured() || cfg.ADSENSE_ENABLED !== true) return;
    if (document.querySelector('script[data-streamflix-adsense]')) return;
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.streamflixAdsense = '1';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(publisherId)}`;
    document.head.appendChild(script);
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderPlaceholders();
    loadScript();
  });
})();
