'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return <Toaster 
    position="top-center"
    toastOptions={{
      style: {
        background: 'hsl(var(--background) / 0.8)',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
        backdropFilter: 'blur(8px)',
      },
    }}
  />;
}
