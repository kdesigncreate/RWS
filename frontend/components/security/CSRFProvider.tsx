'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CSRFProtection } from '@/lib/security';

interface CSRFContextType {
  token: string | null;
  refreshToken: () => void;
  isValid: (token: string) => boolean;
}

const CSRFContext = createContext<CSRFContextType | undefined>(undefined);

interface CSRFProviderProps {
  children: React.ReactNode;
}

export function CSRFProvider({ children }: CSRFProviderProps) {
  const [token, setToken] = useState<string | null>(null);

  const generateNewToken = () => {
    const newToken = CSRFProtection.generateToken();
    setToken(newToken);
    
    // メタタグにも設定（フォーム送信で使用）
    if (typeof window !== 'undefined') {
      let metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.name = 'csrf-token';
        document.head.appendChild(metaTag);
      }
      metaTag.content = newToken;
    }
    
    return newToken;
  };

  const refreshToken = () => {
    generateNewToken();
  };

  const isValid = (tokenToCheck: string) => {
    return CSRFProtection.validateToken(tokenToCheck);
  };

  useEffect(() => {
    // 初回トークン生成
    generateNewToken();

    // 定期的にトークンを更新（30分ごと）
    const interval = setInterval(() => {
      generateNewToken();
    }, 30 * 60 * 1000);

    // ページフォーカス時にトークンを更新
    const handleFocus = () => {
      if (token && !isValid(token)) {
        generateNewToken();
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const contextValue: CSRFContextType = {
    token,
    refreshToken,
    isValid,
  };

  return (
    <CSRFContext.Provider value={contextValue}>
      {children}
    </CSRFContext.Provider>
  );
}

export function useCSRF(): CSRFContextType {
  const context = useContext(CSRFContext);
  if (context === undefined) {
    throw new Error('useCSRF must be used within a CSRFProvider');
  }
  return context;
}

// CSRFトークンを自動的に含むフォームコンポーネント
interface SecureFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>, csrfToken: string) => void;
}

export function SecureForm({ children, onSubmit, ...props }: SecureFormProps) {
  const { token } = useCSRF();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!token) {
      console.error('CSRF token not available');
      return;
    }

    onSubmit(event, token);
  };

  return (
    <form {...props} onSubmit={handleSubmit}>
      {token && (
        <input type="hidden" name="csrfToken" value={token} />
      )}
      {children}
    </form>
  );
}

// CSRFトークンを取得するカスタムフック
export function useCSRFToken(): string | null {
  const { token } = useCSRF();
  return token;
}

// API呼び出し用のCSRFヘッダーを取得
export function useCSRFHeaders(): Record<string, string> {
  const { token } = useCSRF();
  
  return token ? { 'X-CSRF-Token': token } : {};
}

// CSRFトークン付きのfetch関数
export function useSecureFetch() {
  const { token } = useCSRF();

  return async (url: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error('CSRF token not available');
    }

    const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': token,
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  };
}

// React Hook Form用のCSRFトークン取得
export function useCSRFField() {
  const { token } = useCSRF();
  
  return {
    name: 'csrfToken' as const,
    value: token || '',
    type: 'hidden' as const,
  };
}