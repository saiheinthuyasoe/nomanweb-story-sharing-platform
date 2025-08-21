'use client';

import { Toaster, toast } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export function ToastProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerStyle={{
        top: 80, // Account for navbar height
      }}
      toastOptions={{
        duration: 5000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          margin: 0,
        },
        success: {
          duration: 4000,
          style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
            margin: 0,
          },
        },
        error: {
          duration: 6000,
          style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
            margin: 0,
          },
        },
        loading: {
          duration: Infinity,
          style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
            margin: 0,
          },
        },
      }}
    >
      {(t) => (
        <CustomToast
          toast={t}
          onDismiss={() => toast.dismiss(t.id)}
        />
      )}
    </Toaster>
  );
}

interface CustomToastProps {
  toast: any;
  onDismiss: () => void;
}

function CustomToast({ toast: t, onDismiss }: CustomToastProps) {
  const getIcon = () => {
    switch (t.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-[#18243c]" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'loading':
        return (
          <div className="w-5 h-5 border-2 border-[#18243c] border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <Info className="w-5 h-5 text-[#18243c]" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "transform transition-all duration-300 ease-out";
    
    if (!t.visible) {
      return `${baseStyles} translate-x-full opacity-0 scale-95`;
    }
    
    return `${baseStyles} translate-x-0 opacity-100 scale-100`;
  };

  const getBorderColor = () => {
    switch (t.type) {
      case 'success':
        return 'border-l-[#18243c]';
      case 'error':
        return 'border-l-red-500';
      case 'loading':
        return 'border-l-[#18243c]';
      default:
        return 'border-l-[#18243c]';
    }
  };

  const getBgGradient = () => {
    switch (t.type) {
      case 'success':
        return 'from-[#18243c]/5 to-[#22325a]/5 hover:from-[#18243c]/10 hover:to-[#22325a]/10';
      case 'error':
        return 'from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100';
      case 'loading':
        return 'from-[#18243c]/5 to-[#22325a]/5 hover:from-[#18243c]/10 hover:to-[#22325a]/10';
      default:
        return 'from-[#18243c]/5 to-[#22325a]/5 hover:from-[#18243c]/10 hover:to-[#22325a]/10';
    }
  };

  return (
    <div className={getStyles()}>
      <div
        className={`
          relative max-w-md w-full bg-gradient-to-r ${getBgGradient()}
          backdrop-blur-sm border border-white/20 ${getBorderColor()} border-l-4
          rounded-xl shadow-lg hover:shadow-xl
          transition-all duration-300 ease-out
          group cursor-pointer
        `}
        onClick={onDismiss}
      >
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-xl" />
        
        {/* Content */}
        <div className="relative p-4 pr-12">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="p-1.5 rounded-lg bg-white/80 shadow-sm">
                {getIcon()}
              </div>
            </div>
            
            {/* Message */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 leading-relaxed">
                {t.message}
              </div>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="
            absolute top-3 right-3 p-1.5 rounded-lg
            text-gray-400 hover:text-gray-600
            bg-white/60 hover:bg-white/80
            backdrop-blur-sm
            opacity-0 group-hover:opacity-100
            transition-all duration-200 ease-out
            hover:scale-110
          "
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress bar for timed toasts */}
        {t.type !== 'loading' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/50 rounded-b-xl overflow-hidden">
            <div
              className={`h-full transition-all ease-linear ${
                t.type === 'success' ? 'bg-[#18243c]' :
                t.type === 'error' ? 'bg-red-500' : 'bg-[#18243c]'
              }`}
              style={{
                width: `${((t.duration - (Date.now() - t.createdAt)) / t.duration) * 100}%`,
                transition: `width ${t.duration}ms linear`,
              }}
            />
          </div>
        )}

        {/* Subtle animation effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </div>
  );
} 