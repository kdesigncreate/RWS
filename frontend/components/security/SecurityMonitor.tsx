'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { SecurityLogger } from '@/lib/security';
import { securityApi } from '@/lib/api/endpoints';

interface SecurityEvent {
  id: string;
  type: 'rate_limit' | 'xss_attempt' | 'csp_violation' | 'auth_failure' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
  userId?: number;
}

interface SecurityMetrics {
  totalEvents: number;
  eventsLast24h: number;
  rateLimitViolations: number;
  xssAttempts: number;
  cspViolations: number;
  authFailures: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}

// セキュリティ監視プロバイダー
interface SecurityMonitorContextType {
  events: SecurityEvent[];
  metrics: SecurityMetrics;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  reportEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
}

const SecurityMonitorContext = React.createContext<SecurityMonitorContextType | undefined>(undefined);

interface SecurityMonitorProviderProps {
  children: React.ReactNode;
  autoStart?: boolean;
  maxEvents?: number;
  reportInterval?: number;
}

export function SecurityMonitorProvider({ 
  children, 
  autoStart = true,
  maxEvents = 1000,
  reportInterval = 60000, // 1分間隔
}: SecurityMonitorProviderProps) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    eventsLast24h: 0,
    rateLimitViolations: 0,
    xssAttempts: 0,
    cspViolations: 0,
    authFailures: 0,
    threatLevel: 'low',
  });
  const [isMonitoring, setIsMonitoring] = useState(false);

  // イベント報告
  const reportEvent = useCallback((eventData: Omit<SecurityEvent, 'id' | 'timestamp'>) => {
    const event: SecurityEvent = {
      ...eventData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    // イベントをローカル保存
    setEvents(prev => {
      const newEvents = [event, ...prev];
      // 最大数を超えた場合は古いイベントを削除
      return newEvents.slice(0, maxEvents);
    });

    // セキュリティログに記録
    SecurityLogger.logEvent(event.type, {
      severity: event.severity,
      message: event.message,
      details: event.details,
    });

    // 開発環境ではコンソールに出力
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', event);
    }

    // 本番環境では即座にサーバーに報告（高/重要レベルのみ）
    if (process.env.NODE_ENV === 'production' && 
        ['high', 'critical'].includes(event.severity)) {
      reportToServer(event).catch(error => {
        console.error('Failed to report security event:', error);
      });
    }
  }, [maxEvents]);

  // サーバーへの報告
  const reportToServer = async (event: SecurityEvent) => {
    try {
      if (event.type === 'csp_violation') {
        await securityApi.reportCSPViolation(event);
      } else if (event.type === 'xss_attempt') {
        await securityApi.reportXSSAttempt(event);
      }
    } catch (error) {
      console.error('Failed to report to server:', error);
    }
  };

  // メトリクスの更新
  const updateMetrics = useCallback(() => {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const eventsLast24h = events.filter(
      event => new Date(event.timestamp).getTime() > last24h
    );

    const newMetrics: SecurityMetrics = {
      totalEvents: events.length,
      eventsLast24h: eventsLast24h.length,
      rateLimitViolations: events.filter(e => e.type === 'rate_limit').length,
      xssAttempts: events.filter(e => e.type === 'xss_attempt').length,
      cspViolations: events.filter(e => e.type === 'csp_violation').length,
      authFailures: events.filter(e => e.type === 'auth_failure').length,
      threatLevel: calculateThreatLevel(eventsLast24h),
    };

    setMetrics(newMetrics);
  }, [events]);

  // 脅威レベルの計算
  const calculateThreatLevel = (recentEvents: SecurityEvent[]): SecurityMetrics['threatLevel'] => {
    const criticalEvents = recentEvents.filter(e => e.severity === 'critical').length;
    const highEvents = recentEvents.filter(e => e.severity === 'high').length;
    const mediumEvents = recentEvents.filter(e => e.severity === 'medium').length;

    if (criticalEvents > 0 || highEvents > 10) return 'critical';
    if (highEvents > 5 || mediumEvents > 20) return 'high';
    if (highEvents > 0 || mediumEvents > 10) return 'medium';
    return 'low';
  };

  // 監視開始
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  // 監視停止
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // イベントクリア
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // 自動監視開始
  useEffect(() => {
    if (autoStart) {
      startMonitoring();
    }
  }, [autoStart, startMonitoring]);

  // メトリクス更新
  useEffect(() => {
    updateMetrics();
  }, [updateMetrics]);

  // 定期的なサーバー報告
  useEffect(() => {
    if (!isMonitoring) return;

    const intervalId = setInterval(async () => {
      // 未報告の重要イベントをサーバーに送信
      const unreportedEvents = events.filter(
        event => ['high', 'critical'].includes(event.severity) &&
                 !event.details.reported
      );

      for (const event of unreportedEvents) {
        try {
          await reportToServer(event);
          // 報告済みマークを付ける
          setEvents(prev => prev.map(e => 
            e.id === event.id 
              ? { ...e, details: { ...e.details, reported: true } }
              : e
          ));
        } catch (error) {
          console.error('Failed to report event:', error);
        }
      }
    }, reportInterval);

    return () => clearInterval(intervalId);
  }, [isMonitoring, events, reportInterval]);

  const contextValue: SecurityMonitorContextType = {
    events,
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    reportEvent,
    clearEvents,
  };

  return (
    <SecurityMonitorContext.Provider value={contextValue}>
      {children}
    </SecurityMonitorContext.Provider>
  );
}

// セキュリティ監視Hook
export function useSecurityMonitor(): SecurityMonitorContextType {
  const context = React.useContext(SecurityMonitorContext);
  if (context === undefined) {
    throw new Error('useSecurityMonitor must be used within a SecurityMonitorProvider');
  }
  return context;
}

// セキュリティダッシュボードコンポーネント
interface SecurityDashboardProps {
  className?: string;
}

export function SecurityDashboard({ className = '' }: SecurityDashboardProps) {
  const { events, metrics, isMonitoring, clearEvents } = useSecurityMonitor();

  const getThreatLevelColor = (level: SecurityMetrics['threatLevel']) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getSeverityColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">セキュリティ監視</h2>
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getThreatLevelColor(metrics.threatLevel)}`}>
            脅威レベル: {metrics.threatLevel.toUpperCase()}
          </div>
          <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-600">
            {isMonitoring ? '監視中' : '停止中'}
          </span>
        </div>
      </div>

      {/* メトリクス表示 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{metrics.totalEvents}</div>
          <div className="text-sm text-gray-600">総イベント数</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{metrics.eventsLast24h}</div>
          <div className="text-sm text-gray-600">24時間以内</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{metrics.rateLimitViolations}</div>
          <div className="text-sm text-gray-600">レート制限</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{metrics.xssAttempts}</div>
          <div className="text-sm text-gray-600">XSS攻撃</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{metrics.cspViolations}</div>
          <div className="text-sm text-gray-600">CSP違反</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{metrics.authFailures}</div>
          <div className="text-sm text-gray-600">認証失敗</div>
        </div>
      </div>

      {/* イベント一覧 */}
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">最近のイベント</h3>
        <button
          onClick={clearEvents}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          イベントクリア
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {events.slice(0, 20).map((event) => (
          <div key={event.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                  {event.severity.toUpperCase()}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {event.type.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(event.timestamp).toLocaleString('ja-JP')}
              </span>
            </div>
            <p className="text-sm text-gray-800 mb-2">{event.message}</p>
            {Object.keys(event.details).length > 0 && (
              <details className="text-xs text-gray-600">
                <summary className="cursor-pointer hover:text-gray-800">詳細情報</summary>
                <pre className="mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(event.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            セキュリティイベントはありません
          </div>
        )}
      </div>
    </div>
  );
}

// セキュリティアラートコンポーネント
export function SecurityAlert() {
  const { metrics } = useSecurityMonitor();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(['high', 'critical'].includes(metrics.threatLevel));
  }, [metrics.threatLevel]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm bg-white border-l-4 border-red-500 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-3 animate-pulse" />
          <div>
            <h4 className="text-sm font-semibold text-gray-900">セキュリティアラート</h4>
            <p className="text-xs text-gray-600">
              脅威レベルが{metrics.threatLevel}に上昇しました
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">閉じる</span>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}