/**
 * RETRO GAME HUB — pwa.js
 * Progressive Web App install and offline support.
 */

let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  console.log('PWA install available');
});

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('Service worker registered:', reg.scope);
    }).catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  }
});

function promptInstall() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then(choice => {
    console.log('PWA install response:', choice.outcome);
    deferredInstallPrompt = null;
  });
}

window.PWA = { promptInstall };
