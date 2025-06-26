/**
 * セキュリティコンポーネントのインデックス
 */

// セキュリティプロバイダー（将来実装予定）
// export { SecurityProvider, useSecurity } from './SecurityProvider';

// 認証関連（将来実装予定）
// export { AuthProvider, useAuth } from './AuthProvider';

// CSRF保護
export { CSRFProvider, useCSRF, SecureForm, useCSRFToken, useCSRFHeaders, useSecureFetch, useCSRFField } from './CSRFProvider';

// レート制限
export { 
  RateLimitProvider, 
  useRateLimit, 
  useRateLimitedApi, 
  useRateLimitedForm, 
  withRateLimit, 
  RateLimitStatus, 
  RateLimitedButton 
} from './RateLimitProvider';

// XSS保護
export { 
  SafeHtml, 
  SafeText, 
  SafeLink, 
  SafeImage, 
  useSanitizedInput, 
  useCSPViolationReporting, 
  detectXSSAttempt, 
  useXSSDetection, 
  withXSSProtection 
} from './XSSProtection';

// セキュリティ監視
export { 
  SecurityMonitorProvider, 
  useSecurityMonitor, 
  SecurityDashboard, 
  SecurityAlert 
} from './SecurityMonitor';

// 型定義
export type { SecurityConfig, SecurityEvent, ThreatLevel } from './types';