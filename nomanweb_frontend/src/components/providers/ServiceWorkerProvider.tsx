"use client";

import { useEffect } from 'react';

export default function ServiceWorkerProvider() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, show update notification
                  showUpdateNotification();
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from service worker:', event.data);
        
        if (event.data.type === 'CACHE_UPDATED') {
          // Handle cache update notifications
          console.log('Cache updated for:', event.data.url);
        }
      });

      // Handle online/offline status
      const handleOnline = () => {
        console.log('App is online');
        // Sync any pending data
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          navigator.serviceWorker.ready.then((registration) => {
            return registration.sync.register('background-sync');
          });
        }
      };

      const handleOffline = () => {
        console.log('App is offline');
        // Show offline notification
        showOfflineNotification();
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const showUpdateNotification = () => {
    // Create a simple update notification
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #007bff;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 300px;
      ">
        <div style="margin-bottom: 8px; font-weight: 600;">
          Update Available
        </div>
        <div style="margin-bottom: 12px; opacity: 0.9;">
          A new version of NoManWeb is available.
        </div>
        <button 
          onclick="window.location.reload()" 
          style="
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-right: 8px;
          "
        >
          Refresh
        </button>
        <button 
          onclick="this.parentElement.parentElement.remove()" 
          style="
            background: transparent;
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          "
        >
          Later
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  };

  const showOfflineNotification = () => {
    // Create a simple offline notification
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: #dc3545;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        display: flex;
        align-items: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          margin-right: 8px;
          opacity: 0.8;
        "></div>
        You're offline. Some features may be limited.
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove when back online
    const removeOnOnline = () => {
      if (notification.parentElement) {
        notification.remove();
      }
      window.removeEventListener('online', removeOnOnline);
    };
    
    window.addEventListener('online', removeOnOnline);
  };

  return null; // This component doesn't render anything
}