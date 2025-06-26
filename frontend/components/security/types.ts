/**
 * セキュリティ関連の型定義
 */

export interface SecurityConfig {
  // 認証設定
  auth: {
    tokenExpiry: number;
    refreshThreshold: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  
  // レート制限設定
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
  };
  
  // CSRF設定
  csrf: {
    enabled: boolean;
    tokenLength: number;
    refreshInterval: number;
    secureCookies: boolean;
  };
  
  // XSS保護設定
  xss: {
    enabled: boolean;
    allowedTags: string[];
    allowedAttributes: Record<string, string[]>;
    stripUnknownTags: boolean;
  };
  
  // 監視設定
  monitoring: {
    enabled: boolean;
    reportInterval: number;
    maxEvents: number;
    autoReport: boolean;
  };
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  message: string;
  details: Record<string, unknown>;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
  userId?: number;
  sessionId?: string;
}

export type SecurityEventType = 
  | 'rate_limit'
  | 'xss_attempt'
  | 'csp_violation'
  | 'auth_failure'
  | 'suspicious_activity'
  | 'file_upload_violation'
  | 'sql_injection_attempt'
  | 'privilege_escalation'
  | 'data_exfiltration'
  | 'brute_force_attack';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityMetrics {
  totalEvents: number;
  eventsLast24h: number;
  eventsLastHour: number;
  rateLimitViolations: number;
  xssAttempts: number;
  cspViolations: number;
  authFailures: number;
  suspiciousActivities: number;
  threatLevel: ThreatLevel;
  trendDirection: 'up' | 'down' | 'stable';
}

export interface UserSession {
  id: string;
  userId: number;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export interface AuthenticationContext {
  user: User | null;
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  roles: string[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  bio?: string;
  website?: string;
  avatar?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
  roles: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  sanitizedData?: unknown;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface CSRFToken {
  token: string;
  expiresAt: Date;
}

export interface FileUploadSecurity {
  maxSize: number;
  allowedTypes: string[];
  allowedExtensions: string[];
  scanForViruses: boolean;
  quarantineSuspicious: boolean;
}

export interface APISecurityConfig {
  requireAuth: boolean;
  requireCSRF: boolean;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  permissions?: string[];
  roles?: string[];
  allowAnonymous?: boolean;
}

export interface SecurityAuditLog {
  id: string;
  action: string;
  resource: string;
  userId?: number;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details: Record<string, unknown>;
  timestamp: Date;
}

export interface ThreatIntelligence {
  ipAddress: string;
  type: 'malicious' | 'suspicious' | 'safe';
  source: string;
  confidence: number;
  lastSeen: Date;
  description?: string;
}

export interface SecurityAlert {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  title: string;
  message: string;
  affectedResource: string;
  detectedAt: Date;
  resolvedAt?: Date;
  status: 'open' | 'acknowledged' | 'resolved' | 'false_positive';
  assignedTo?: string;
  actions: string[];
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type SecurityConfigPartial = DeepPartial<SecurityConfig>;

export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;

export type SecurityEventHandler = EventHandler<SecurityEvent>;

export type SecurityEventListener = {
  type: SecurityEventType;
  handler: SecurityEventHandler;
};

// Hook types
export interface UseSecurityReturn {
  config: SecurityConfig;
  updateConfig: (config: SecurityConfigPartial) => void;
  isSecure: boolean;
  threatLevel: ThreatLevel;
  events: SecurityEvent[];
  reportEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => void;
}

export interface UseAuthReturn extends AuthenticationContext {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  enableTwoFactor: () => Promise<void>;
  disableTwoFactor: () => Promise<void>;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UseRateLimitReturn {
  checkLimit: (action: string, limit?: number) => Promise<boolean>;
  getRemainingRequests: (action: string) => number;
  isBlocked: (action: string) => boolean;
  resetTime: (action: string) => number;
}

export interface UseCSRFReturn {
  token: string | null;
  refreshToken: () => void;
  isValid: (token: string) => boolean;
  headers: Record<string, string>;
}

// Error types
export class SecurityError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: SecuritySeverity = 'medium',
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class AuthenticationError extends SecurityError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUTH_ERROR', 'high', context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends SecurityError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUTHZ_ERROR', 'high', context);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends SecurityError {
  constructor(message: string, public retryAfter: number, context?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_ERROR', 'medium', context);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends SecurityError {
  constructor(
    message: string,
    public errors: Record<string, string[]>,
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 'low', context);
    this.name = 'ValidationError';
  }
}

export class XSSError extends SecurityError {
  constructor(message: string, public input: string, context?: Record<string, unknown>) {
    super(message, 'XSS_ERROR', 'high', context);
    this.name = 'XSSError';
  }
}

export class CSRFError extends SecurityError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CSRF_ERROR', 'high', context);
    this.name = 'CSRFError';
  }
}