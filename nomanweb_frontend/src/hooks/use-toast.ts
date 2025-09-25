import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

// Simple toast implementation
let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default', duration = 5000 }: ToastProps) => {
    const id = (++toastId).toString();
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);

    // For now, we'll also show a browser notification or console log
    // In a real app, you'd integrate with a toast library like react-hot-toast or sonner
    if (typeof window !== 'undefined') {
      const message = `${title ? title + ': ' : ''}${description || ''}`;
      
      // Try to use browser notification, fallback to console
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title || 'Notification', {
          body: description,
          icon: '/logo.png' // assuming you have a logo
        });
      } else {
        // Fallback to console log or alert
        console.log(`Toast [${variant}]: ${message}`);
        
        // For development, you might want to use alert for destructive toasts
        if (variant === 'destructive') {
          alert(message);
        }
      }
    }

    return {
      id,
      dismiss: () => setToasts(prev => prev.filter(t => t.id !== id)),
    };
  }, []);

  const dismiss = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  return {
    toast,
    toasts,
    dismiss,
  };
}

// For compatibility with existing code, export a hook that matches the expected interface
export const useToast2 = () => {
  return {
    toast: ({ title, description, variant }: ToastProps) => {
      // Simple implementation - in a real app you'd use a proper toast library
      const message = `${title ? title + ': ' : ''}${description || ''}`;
      
      if (variant === 'destructive') {
        console.error('Toast Error:', message);
        if (typeof window !== 'undefined') {
          alert(`Error: ${message}`);
        }
      } else {
        console.log('Toast:', message);
        if (typeof window !== 'undefined' && title) {
          // For success/default messages, you might want to show a temporary notification
          const notification = document.createElement('div');
          notification.innerHTML = `
            <div style="
              position: fixed;
              top: 20px;
              right: 20px;
              background: ${variant === 'success' ? '#10b981' : '#3b82f6'};
              color: white;
              padding: 12px 16px;
              border-radius: 6px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              z-index: 1000;
              max-width: 300px;
            ">
              <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
              ${description ? `<div style="font-size: 14px; opacity: 0.9;">${description}</div>` : ''}
            </div>
          `;
          document.body.appendChild(notification);
          
          // Remove after 5 seconds
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 5000);
        }
      }
    }
  };
}; 