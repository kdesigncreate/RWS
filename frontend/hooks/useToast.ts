import { useCallback } from 'react';
import { notificationService } from '@/lib/services/notification-service';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const { title, description, variant = 'default' } = options;
    
    if (variant === 'destructive') {
      notificationService.error(title, description);
    } else {
      notificationService.success(title, description);
    }
  }, []);

  return { toast };
}