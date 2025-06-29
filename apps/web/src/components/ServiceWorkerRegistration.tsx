'use client';

import { useEffect } from 'react';

// Extend ServiceWorkerRegistration interface for background sync
declare global {
  interface ServiceWorkerRegistration {
    sync?: {
      register(tag: string): Promise<void>;
    };
  }
}

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              console.log('New service worker available');
              
              // You could show a notification to the user here
              if (confirm('A new version is available. Reload to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from service worker:', event.data);
      });

      // Register for background sync if supported
      if (registration.sync) {
        console.log('Background sync is supported');
      }

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      }

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  return null; // This component doesn't render anything
}

// Utility functions for PWA features
export const PWAUtils = {
  // Check if app is running as PWA
  isPWA: () => {
    return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  },

  // Check if device is iOS
  isIOS: () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  // Check if running in browser
  isInBrowser: () => {
    return !PWAUtils.isPWA() && !PWAUtils.isIOS();
  },

  // Show install prompt
  showInstallPrompt: async () => {
    if ('beforeinstallprompt' in window) {
      // This will be handled by the beforeinstallprompt event
      return true;
    }
    return false;
  },

  // Schedule background sync
  scheduleSync: async (tag: string) => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.sync) {
          await registration.sync.register(tag);
          console.log('Background sync scheduled:', tag);
          return true;
        }
      } catch (error) {
        console.error('Background sync failed:', error);
        return false;
      }
    }
    return false;
  },

  // Get network status
  getNetworkStatus: () => {
    return {
      online: navigator.onLine,
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    };
  },

  // Store data for offline use
  storeOfflineData: async (key: string, data: any) => {
    try {
      if ('indexedDB' in window) {
        // Use IndexedDB for larger data
        localStorage.setItem(`offline_${key}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } else {
        // Fallback to localStorage
        localStorage.setItem(`offline_${key}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      }
      return true;
    } catch (error) {
      console.error('Failed to store offline data:', error);
      return false;
    }
  },

  // Retrieve offline data
  getOfflineData: (key: string) => {
    try {
      const stored = localStorage.getItem(`offline_${key}`);
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        // Check if data is less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to retrieve offline data:', error);
      return null;
    }
  }
};
