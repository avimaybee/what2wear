'use client';

import { Toaster, toast } from 'react-hot-toast';

export function useToast() {
  return {
    showToast: ({ variant, title, description }: { variant: 'success' | 'error' | 'info', title: string, description: string }) => {
      if (variant === 'success') {
        toast.success(`${title}: ${description}`);
      } else if (variant === 'error') {
        toast.error(`${title}: ${description}`);
      } else {
        toast(`${title}: ${description}`);
      }
    }
  };
}

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
