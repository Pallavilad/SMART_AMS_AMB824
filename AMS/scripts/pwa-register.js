// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/AMB824_AMS/sw.js')
      .then(registration => {
        console.log('[AMS] Service Worker registered:', registration.scope);
      })
      .catch(error => {
        console.warn('[AMS] Service Worker registration failed:', error);
      });
  });
}

