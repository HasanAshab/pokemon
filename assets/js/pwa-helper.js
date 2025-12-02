// PWA Helper - Add this to any page for consistent PWA behavior
class PWAHelper {
  constructor() {
    this.deferredPrompt = null;
    this.installButton = null;
    this.init();
  }

  init() {
    this.setupInstallPrompt();
    this.checkInstallStatus();
    this.setupServiceWorker();
  }

  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA: beforeinstallprompt event fired');
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA: App was installed');
      this.hideInstallButton();
      this.deferredPrompt = null;
    });
  }

  showInstallButton() {
    if (this.installButton) return; // Already showing

    this.installButton = document.createElement('button');
    this.installButton.innerHTML = '📱 Install App';
    this.installButton.className = 'pwa-install-button';
    
    // Add styles
    const styles = `
      .pwa-install-button {
        position: fixed !important;
        top: 10px !important;
        right: 10px !important;
        z-index: 10000 !important;
        padding: 10px 15px !important;
        background: #28a745 !important;
        color: white !important;
        border: none !important;
        border-radius: 5px !important;
        cursor: pointer !important;
        font-size: 14px !important;
        font-family: Arial, sans-serif !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
        transition: all 0.3s ease !important;
      }
      .pwa-install-button:hover {
        background: #218838 !important;
        transform: scale(1.05) !important;
      }
    `;
    
    // Add styles to page if not already added
    if (!document.getElementById('pwa-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'pwa-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }

    this.installButton.addEventListener('click', async () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        const choiceResult = await this.deferredPrompt.userChoice;
        console.log('PWA: User choice:', choiceResult.outcome);
        
        this.deferredPrompt = null;
        this.hideInstallButton();
      }
    });

    document.body.appendChild(this.installButton);
  }

  hideInstallButton() {
    if (this.installButton) {
      this.installButton.remove();
      this.installButton = null;
    }
  }

  checkInstallStatus() {
    // Check if already running as installed app
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    
    if (isStandalone) {
      console.log('PWA: App is running in standalone mode');
      return true;
    }
    return false;
  }

  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(registration => {
            console.log('PWA: SW registered:', registration);
          })
          .catch(registrationError => {
            console.log('PWA: SW registration failed:', registrationError);
          });
      });
    }
  }

  // Utility method to add PWA meta tags to current page
  addMetaTags() {
    const metaTags = [
      { name: 'theme-color', content: '#3b82f6' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'Pokedex' }
    ];

    metaTags.forEach(tag => {
      if (!document.querySelector(`meta[name="${tag.name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = tag.name;
        meta.content = tag.content;
        document.head.appendChild(meta);
      }
    });

    // Add manifest link if not present
    if (!document.querySelector('link[rel="manifest"]')) {
      const manifest = document.createElement('link');
      manifest.rel = 'manifest';
      manifest.href = './manifest.json';
      document.head.appendChild(manifest);
    }
  }
}

// Auto-initialize PWA helper
const pwaHelper = new PWAHelper();

// Export for manual use
window.PWAHelper = PWAHelper;