import { useCallback } from 'react';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const { title, description, variant = 'default' } = options;
    
    // Simple console log for now - can be enhanced later with a proper toast UI
    const message = description ? `${title}: ${description}` : title;
    
    if (variant === 'destructive') {
      console.error('Toast Error:', message);
    } else {
      console.log('Toast Success:', message);
    }

    // For now, we can use browser alert as a fallback
    if (typeof window !== 'undefined') {
      // Simple notification - can be replaced with a proper toast library later
      alert(message);
    }
  }, []);

  return { toast };
}