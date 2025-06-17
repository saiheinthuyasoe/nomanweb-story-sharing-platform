'use client';

import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';

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
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--nomanweb-primary)',
          color: '#fff',
        },
      }}
    />
  );
} 