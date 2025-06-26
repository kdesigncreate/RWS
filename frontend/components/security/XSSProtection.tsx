'use client';

import React from 'react';
import Image from 'next/image';
// import DOMPurify from 'isomorphic-dompurify'; // Not available, using fallback sanitization
import { InputSanitizer } from '@/lib/security';

// XSS保護設定
const XSS_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 
    'a', 'img', 'code', 'pre'
  ],
  ALLOWED_ATTRIBUTES: {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'blockquote': ['cite'],
    '*': ['class', 'id']
  },
  ALLOWED_SCHEMES: ['http', 'https', 'mailto', 'tel'],
  FORBIDDEN_TAGS: ['script', 'object', 'embed', 'form', 'input', 'iframe'],
  FORBIDDEN_ATTRIBUTES: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

// 安全なHTMLレンダリングコンポーネント
interface SafeHtmlProps {
  html: string;
  className?: string;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  stripTags?: boolean;
}

export function SafeHtml({
  html,
  className = '',
  allowedTags: _allowedTags = XSS_CONFIG.ALLOWED_TAGS,
  allowedAttributes: _allowedAttributes = XSS_CONFIG.ALLOWED_ATTRIBUTES,
  stripTags = false,
}: SafeHtmlProps) {
  const sanitizedHtml = React.useMemo(() => {
    if (stripTags) {
      return InputSanitizer.stripHtml(html);
    }

    // InputSanitizerを使用してHTMLをサニタイズ（DOMPurifyの代替）
    return InputSanitizer.escapeHtml(InputSanitizer.removeJavaScript(html));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, stripTags]);

  if (stripTags) {
    return <span className={className}>{sanitizedHtml}</span>;
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

// テキストエスケープコンポーネント
interface SafeTextProps {
  text: string;
  className?: string;
  maxLength?: number;
  showEllipsis?: boolean;
}

export function SafeText({
  text,
  className = '',
  maxLength,
  showEllipsis = true,
}: SafeTextProps) {
  const sanitizedText = React.useMemo(() => {
    let safe = InputSanitizer.escapeHtml(text);
    
    if (maxLength && safe.length > maxLength) {
      safe = safe.substring(0, maxLength);
      if (showEllipsis) {
        safe += '...';
      }
    }
    
    return safe;
  }, [text, maxLength, showEllipsis]);

  return <span className={className}>{sanitizedText}</span>;
}

// URL検証付きリンクコンポーネント
interface SafeLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  target?: '_blank' | '_self';
  rel?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function SafeLink({
  href,
  children,
  className = '',
  target = '_self',
  rel,
  onClick,
}: SafeLinkProps) {
  const sanitizedHref = React.useMemo(() => {
    return InputSanitizer.sanitizeUrl(href);
  }, [href]);

  const safeRel = React.useMemo(() => {
    let relValue = rel || '';
    
    // 外部リンクの場合は自動的にnoopener noreferrerを追加
    if (target === '_blank') {
      const relParts = relValue ? relValue.split(' ') : [];
      if (!relParts.includes('noopener')) {
        relParts.push('noopener');
      }
      if (!relParts.includes('noreferrer')) {
        relParts.push('noreferrer');
      }
      relValue = relParts.join(' ');
    }
    
    return relValue;
  }, [rel, target]);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // 危険なリンクをブロック
    if (sanitizedHref === '#') {
      event.preventDefault();
      console.warn('Blocked potentially dangerous link:', href);
      return;
    }
    
    onClick?.(event);
  };

  return (
    <a
      href={sanitizedHref}
      className={className}
      target={target}
      rel={safeRel}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

// 画像コンポーネント（XSS対策付き）
interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onError?: () => void;
  onLoad?: () => void;
}

export function SafeImage({
  src,
  alt,
  className = '',
  width,
  height,
  onError,
  onLoad,
}: SafeImageProps) {
  const [imageSrc, setImageSrc] = React.useState<string>('');
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    // URLの検証
    try {
      const url = new URL(src, window.location.origin);
      
      // 許可されたプロトコルのみ
      if (['http:', 'https:', 'data:'].includes(url.protocol)) {
        setImageSrc(src);
      } else {
        setHasError(true);
      }
    } catch {
      setHasError(true);
    }
  }, [src]);

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const handleLoad = () => {
    setHasError(false);
    onLoad?.();
  };

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">画像を読み込めません</span>
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={InputSanitizer.escapeHtml(alt)}
      className={className}
      width={width || 400}
      height={height || 300}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
    />
  );
}

// フォーム入力値のサニタイズHook
export function useSanitizedInput(initialValue: string = '') {
  const [value, setValue] = React.useState(initialValue);
  const [sanitizedValue, setSanitizedValue] = React.useState(initialValue);

  const handleChange = React.useCallback((
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const rawValue = event.target.value;
    setValue(rawValue);
    
    // リアルタイムでサニタイズ
    const sanitized = InputSanitizer.escapeHtml(rawValue);
    setSanitizedValue(sanitized);
  }, []);

  const reset = React.useCallback(() => {
    setValue('');
    setSanitizedValue('');
  }, []);

  return {
    value,
    sanitizedValue,
    handleChange,
    reset,
  };
}

// コンテンツセキュリティ違反の検出・報告
export function useCSPViolationReporting() {
  React.useEffect(() => {
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      const violation = {
        blockedURI: event.blockedURI,
        columnNumber: event.columnNumber,
        lineNumber: event.lineNumber,
        originalPolicy: event.originalPolicy,
        sourceFile: event.sourceFile,
        violatedDirective: event.violatedDirective,
        timestamp: new Date().toISOString(),
      };

      // 開発環境ではコンソールに出力
      if (process.env.NODE_ENV === 'development') {
        console.warn('CSP Violation:', violation);
      }

      // 本番環境では監視サービスに送信
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/security/csp-violation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(violation),
        }).catch(error => {
          console.error('Failed to report CSP violation:', error);
        });
      }
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolation);

    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
    };
  }, []);
}

// XSS攻撃の検出
export function detectXSSAttempt(input: string): boolean {
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
    /onfocus\s*=/gi,
    /onblur\s*=/gi,
    /<iframe[\s\S]*?>/gi,
    /<object[\s\S]*?>/gi,
    /<embed[\s\S]*?>/gi,
    /<form[\s\S]*?>/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /@import/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

// XSS攻撃検出Hook
export function useXSSDetection() {
  const detectAndReport = React.useCallback((input: string, context: string) => {
    if (detectXSSAttempt(input)) {
      // セキュリティログに記録
      const logEntry = {
        type: 'xss_attempt',
        input: input.substring(0, 200), // 最初の200文字のみログ
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // 開発環境ではコンソールに警告
      if (process.env.NODE_ENV === 'development') {
        console.warn('XSS attempt detected:', logEntry);
      }

      // 本番環境では監視サービスに送信
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/security/xss-attempt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logEntry),
        }).catch(error => {
          console.error('Failed to report XSS attempt:', error);
        });
      }

      return true;
    }

    return false;
  }, []);

  return { detectAndReport };
}

// HOC: XSS保護付きコンポーネント
export function withXSSProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const XSSProtectedComponent = React.memo((props: P) => {
    useCSPViolationReporting();
    
    return <WrappedComponent {...props} />;
  });
  
  XSSProtectedComponent.displayName = `withXSSProtection(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return XSSProtectedComponent;
}