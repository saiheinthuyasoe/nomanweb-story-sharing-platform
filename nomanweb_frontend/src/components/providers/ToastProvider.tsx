"use client";

import { Toaster, toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

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
          background: "transparent",
          boxShadow: "none",
          padding: 0,
          margin: 0,
        },
        success: {
          duration: 4000,
          style: {
            background: "transparent",
            boxShadow: "none",
            padding: 0,
            margin: 0,
          },
        },
        error: {
          duration: 6000,
          style: {
            background: "transparent",
            boxShadow: "none",
            padding: 0,
            margin: 0,
          },
        },
        loading: {
          duration: Infinity,
          style: {
            background: "transparent",
            boxShadow: "none",
            padding: 0,
            margin: 0,
          },
        },
      }}
    >
      {(t) => <CustomToast toast={t} onDismiss={() => toast.dismiss(t.id)} />}
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
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "loading":
        return (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        );
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "transform transition-all duration-200 ease-out";

    if (!t.visible) {
      return `${baseStyles} translate-x-full opacity-0`;
    }

    return `${baseStyles} translate-x-0 opacity-100`;
  };

  const getBackgroundColor = () => {
    switch (t.type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "loading":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div className={getStyles()}>
      <div
        className={`
          max-w-sm w-full ${getBackgroundColor()}
          border rounded-lg
          transition-all duration-200 ease-out
          cursor-pointer
        `}
        onClick={onDismiss}
      >
        {/* Content */}
        <div className="p-3">
          <div className="flex items-center space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0">{getIcon()}</div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-800">{t.message}</div>
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="
                flex-shrink-0 p-1 rounded
                text-gray-400 hover:text-gray-600
                hover:bg-gray-100
                transition-colors duration-150
              "
              aria-label="Dismiss notification"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
