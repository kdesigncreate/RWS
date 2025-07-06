/**
 * 通知サービス層
 * マイクロサービス化準備として、通知関連の処理を分離
 */

import { logger } from '@/lib/logger';
import { analytics } from '@/lib/analytics';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationOptions {
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, unknown>;
}

export interface ToastNotification extends Notification {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export type NotificationSubscriber = (notification: Notification) => void;

export class NotificationService {
  private static instance: NotificationService;
  private subscribers: Set<NotificationSubscriber> = new Set();
  private notifications: Map<string, Notification> = new Map();
  private toastQueue: ToastNotification[] = [];
  private isProcessingQueue = false;
  private pushSubscription: PushSubscription | null = null;

  private constructor() {
    this.initializePushNotifications();
    this.setupServiceWorker();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 通知の表示
  public show(
    type: NotificationType,
    title: string,
    message?: string,
    options: NotificationOptions = {}
  ): string {
    const notification: Notification = {
      id: this.generateId(),
      type,
      title,
      message,
      duration: options.duration ?? this.getDefaultDuration(type),
      persistent: options.persistent ?? false,
      actions: options.actions,
      metadata: options.metadata,
      timestamp: new Date(),
    };

    this.notifications.set(notification.id, notification);
    this.notifySubscribers(notification);

    logger.info('Notification shown', {
      id: notification.id,
      type,
      title,
      persistent: notification.persistent,
    });

    analytics.trackEvent('notification_shown', {
      type,
      title,
      persistent: notification.persistent,
    });

    // 永続的でない通知は自動削除
    if (!notification.persistent && notification.duration) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
    }

    return notification.id;
  }

  // 成功通知
  public success(title: string, message?: string, options?: NotificationOptions): string {
    return this.show('success', title, message, options);
  }

  // エラー通知
  public error(title: string, message?: string, options?: NotificationOptions): string {
    return this.show('error', title, message, {
      ...options,
      persistent: options?.persistent ?? true, // エラーはデフォルトで永続的
    });
  }

  // 警告通知
  public warning(title: string, message?: string, options?: NotificationOptions): string {
    return this.show('warning', title, message, options);
  }

  // 情報通知
  public info(title: string, message?: string, options?: NotificationOptions): string {
    return this.show('info', title, message, options);
  }

  // トースト通知（画面の端に表示される通知）
  public toast(
    type: NotificationType,
    title: string,
    message?: string,
    position: ToastNotification['position'] = 'top-right'
  ): string {
    const notification: ToastNotification = {
      id: this.generateId(),
      type,
      title,
      message,
      position,
      duration: this.getDefaultDuration(type),
      persistent: false,
      timestamp: new Date(),
    };

    this.toastQueue.push(notification);
    this.processToastQueue();

    return notification.id;
  }

  // 通知の削除
  public dismiss(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      this.notifications.delete(id);
      
      logger.info('Notification dismissed', { id });
      
      analytics.trackEvent('notification_dismissed', {
        id,
        type: notification.type,
        title: notification.title,
      });

      // 削除通知を送信
      this.notifySubscribers({
        ...notification,
        type: 'info',
        title: 'dismissed',
        metadata: { originalId: id },
      });
    }
  }

  // 全通知の削除
  public dismissAll(): void {
    const count = this.notifications.size;
    this.notifications.clear();
    
    logger.info('All notifications dismissed', { count });
    
    analytics.trackEvent('all_notifications_dismissed', { count });
  }

  // 通知の取得
  public getNotification(id: string): Notification | undefined {
    return this.notifications.get(id);
  }

  // 全通知の取得
  public getAllNotifications(): Notification[] {
    return Array.from(this.notifications.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  // 未読通知の数
  public getUnreadCount(): number {
    return this.notifications.size;
  }

  // プッシュ通知の送信
  public async sendPushNotification(payload: PushNotificationPayload): Promise<void> {
    if (!this.pushSubscription) {
      logger.warn('No push subscription available');
      return;
    }

    try {
      // プッシュ通知の送信（実際の実装では外部サービスを使用）
      await fetch('/api/notifications/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: this.pushSubscription,
          payload,
        }),
      });

      logger.info('Push notification sent', { title: payload.title });
      
      analytics.trackEvent('push_notification_sent', {
        title: payload.title,
      });
    } catch (error) {
      logger.error('Failed to send push notification', { error, payload });
    }
  }

  // 購読者の登録
  public subscribe(callback: NotificationSubscriber): () => void {
    this.subscribers.add(callback);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // ブラウザ通知の許可要求
  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      logger.warn('Browser does not support notifications');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    
    logger.info('Notification permission', { permission });
    
    analytics.trackEvent('notification_permission_requested', { permission });
    
    return permission;
  }

  // プッシュ通知の登録
  public async subscribeToPush(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      logger.warn('Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ),
      });

      this.pushSubscription = subscription;
      
      // サーバーに購読情報を送信
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      logger.info('Push subscription created');
      
      analytics.trackEvent('push_subscription_created');
      
      return subscription;
    } catch (error) {
      logger.error('Failed to subscribe to push notifications', { error });
      return null;
    }
  }

  // プッシュ通知の登録解除
  public async unsubscribeFromPush(): Promise<void> {
    if (this.pushSubscription) {
      try {
        await this.pushSubscription.unsubscribe();
        
        // サーバーに登録解除を通知
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.pushSubscription),
        });

        this.pushSubscription = null;
        
        logger.info('Push subscription removed');
        
        analytics.trackEvent('push_subscription_removed');
      } catch (error) {
        logger.error('Failed to unsubscribe from push notifications', { error });
      }
    }
  }

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultDuration(type: NotificationType): number {
    switch (type) {
      case 'success':
        return 3000;
      case 'info':
        return 4000;
      case 'warning':
        return 5000;
      case 'error':
        return 0; // 永続的
      default:
        return 4000;
    }
  }

  private notifySubscribers(notification: Notification): void {
    this.subscribers.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        logger.error('Error in notification subscriber', { error });
      }
    });
  }

  private async processToastQueue(): Promise<void> {
    if (this.isProcessingQueue || this.toastQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.toastQueue.length > 0) {
      const toast = this.toastQueue.shift()!;
      
      // ブラウザ通知として表示
      if (Notification.permission === 'granted') {
        new Notification(toast.title, {
          body: toast.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      }

      // 通常の通知として処理
      this.notifications.set(toast.id, toast);
      this.notifySubscribers(toast);

      if (toast.duration) {
        setTimeout(() => {
          this.dismiss(toast.id);
        }, toast.duration);
      }

      // 次のトーストまで少し待機
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessingQueue = false;
  }

  private async initializePushNotifications(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          this.pushSubscription = subscription;
          logger.info('Existing push subscription found');
        }
      } catch (error) {
        logger.error('Failed to initialize push notifications', { error });
      }
    }
  }

  private setupServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NOTIFICATION_CLICK') {
          this.handleNotificationClick(event.data.notificationData);
        }
      });
    }
  }

  private handleNotificationClick(data: any): void {
    logger.info('Notification clicked', { data });
    
    analytics.trackEvent('notification_clicked', { data });
    
    // 通知クリック時の処理をここに実装
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// シングルトンインスタンスをエクスポート
export const notificationService = NotificationService.getInstance();