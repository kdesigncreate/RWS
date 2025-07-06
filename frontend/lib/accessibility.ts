/**
 * アクセシビリティユーティリティとヘルパー
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * キーボードナビゲーション用のキー定数
 */
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

/**
 * ARIA ライブリージョンの優先度
 */
export type LiveRegionPoliteness = 'off' | 'polite' | 'assertive';

/**
 * フォーカス管理用のフック
 */
export const useFocusManagement = () => {
  const focusableElementsSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  const getFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    return Array.from(container.querySelectorAll(focusableElementsSelector))
      .filter(el => {
        const element = el as HTMLElement;
        return element.offsetParent !== null && !element.hasAttribute('disabled');
      }) as HTMLElement[];
  }, [focusableElementsSelector]);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== KeyboardKeys.TAB) return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // 初期フォーカス
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [getFocusableElements]);

  return {
    getFocusableElements,
    trapFocus,
  };
};

/**
 * フォーカストラップフック
 */
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null);
  const { trapFocus } = useFocusManagement();

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const cleanup = trapFocus(container);

    return cleanup;
  }, [isActive, trapFocus]);

  return containerRef;
};

/**
 * Escapeキーでの閉じる機能
 */
export const useEscapeKey = (callback: () => void, isActive: boolean = true) => {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === KeyboardKeys.ESCAPE) {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [callback, isActive]);
};

/**
 * ライブリージョンアナウンサー
 */
export class LiveRegionAnnouncer {
  private static instance: LiveRegionAnnouncer;
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;

  private constructor() {
    this.createLiveRegions();
  }

  public static getInstance(): LiveRegionAnnouncer {
    if (!LiveRegionAnnouncer.instance) {
      LiveRegionAnnouncer.instance = new LiveRegionAnnouncer();
    }
    return LiveRegionAnnouncer.instance;
  }

  private createLiveRegions(): void {
    if (typeof window === 'undefined') return;

    // polite region
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.className = 'sr-only';
    document.body.appendChild(this.politeRegion);

    // assertive region
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.className = 'sr-only';
    document.body.appendChild(this.assertiveRegion);
  }

  public announce(message: string, politeness: LiveRegionPoliteness = 'polite'): void {
    if (politeness === 'off') return;

    const region = politeness === 'assertive' ? this.assertiveRegion : this.politeRegion;
    
    if (region) {
      // 一度クリアしてから設定することで確実にアナウンスされる
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  }

  public clear(politeness: LiveRegionPoliteness = 'polite'): void {
    const region = politeness === 'assertive' ? this.assertiveRegion : this.politeRegion;
    
    if (region) {
      region.textContent = '';
    }
  }
}

/**
 * スクリーンリーダー用のアナウンスフック
 */
export const useAnnounce = () => {
  const announcer = LiveRegionAnnouncer.getInstance();

  const announce = useCallback((message: string, politeness: LiveRegionPoliteness = 'polite') => {
    announcer.announce(message, politeness);
  }, [announcer]);

  const clear = useCallback((politeness: LiveRegionPoliteness = 'polite') => {
    announcer.clear(politeness);
  }, [announcer]);

  return { announce, clear };
};

/**
 * フォーカス可視性の管理
 */
export const useFocusVisible = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === KeyboardKeys.TAB) {
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
};

/**
 * 色のコントラスト比計算
 */
export const calculateContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    // 簡易的なRGB値の抽出（実際の実装ではより robust にする）
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const linearize = (value: number) => {
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * WCAG準拠のテキストサイズ確認
 */
export const checkTextSize = (fontSize: number, isLargeText: boolean = false): {
  isValid: boolean;
  minSize: number;
  recommendation: string;
} => {
  const minRegularText = 16; // 16px
  const minLargeText = 18; // 18px for bold or 24px for regular
  
  const minSize = isLargeText ? minLargeText : minRegularText;
  const isValid = fontSize >= minSize;

  return {
    isValid,
    minSize,
    recommendation: isValid 
      ? 'Text size meets WCAG guidelines'
      : `Text size should be at least ${minSize}px for ${isLargeText ? 'large' : 'regular'} text`
  };
};

/**
 * ARIA属性ヘルパー
 */
export const createAriaAttributes = {
  describedBy: (id: string) => ({ 'aria-describedby': id }),
  labelledBy: (id: string) => ({ 'aria-labelledby': id }),
  label: (label: string) => ({ 'aria-label': label }),
  expanded: (expanded: boolean) => ({ 'aria-expanded': expanded }),
  selected: (selected: boolean) => ({ 'aria-selected': selected }),
  checked: (checked: boolean) => ({ 'aria-checked': checked }),
  disabled: (disabled: boolean) => ({ 'aria-disabled': disabled }),
  hidden: (hidden: boolean) => ({ 'aria-hidden': hidden }),
  live: (politeness: LiveRegionPoliteness) => ({ 'aria-live': politeness }),
  atomic: (atomic: boolean) => ({ 'aria-atomic': atomic }),
  role: (role: string) => ({ role }),
};

/**
 * フォーカス管理ユーティリティ
 */
export const focusUtils = {
  // 要素にフォーカス
  focus: (element: HTMLElement | null, options?: FocusOptions) => {
    if (element) {
      element.focus(options);
    }
  },

  // 遅延フォーカス
  focusDelay: (element: HTMLElement | null, delay: number = 100, options?: FocusOptions) => {
    setTimeout(() => {
      if (element) {
        element.focus(options);
      }
    }, delay);
  },

  // 最初のフォーカス可能な要素にフォーカス
  focusFirst: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }
  },

  // 前回フォーカスされていた要素を保存・復元
  saveFocus: (): (() => void) => {
    const activeElement = document.activeElement as HTMLElement;
    return () => {
      if (activeElement && activeElement.focus) {
        activeElement.focus();
      }
    };
  },
};

/**
 * アクセシビリティチェッカー
 */
export const accessibilityChecker = {
  // 必須のalt属性チェック
  checkImageAlt: (img: HTMLImageElement): boolean => {
    return img.hasAttribute('alt');
  },

  // フォームラベルチェック
  checkFormLabel: (input: HTMLInputElement): boolean => {
    const id = input.getAttribute('id');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');
    
    if (ariaLabel || ariaLabelledBy) {
      return true;
    }
    
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      return !!label;
    }
    
    return false;
  },

  // 見出しの階層チェック
  checkHeadingHierarchy: (): boolean => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let previousLevel = 0;
    
    for (const heading of headings) {
      const currentLevel = parseInt(heading.tagName.charAt(1));
      
      if (currentLevel > previousLevel + 1) {
        return false; // スキップした見出しレベル
      }
      
      previousLevel = currentLevel;
    }
    
    return true;
  },

  // コントラスト比チェック
  checkColorContrast: (element: HTMLElement): boolean => {
    const style = window.getComputedStyle(element);
    const backgroundColor = style.backgroundColor;
    const color = style.color;
    
    // 簡易的なチェック（実際の実装ではより詳細に）
    if (backgroundColor && color && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      // 実際のコントラスト比計算を実装
      return true; // プレースホルダー
    }
    
    return true;
  },
};

// スクリーンリーダー専用のCSS
export const srOnlyClass = 'sr-only';

// アクセシビリティ向上のためのCSS追加
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .sr-only {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }

    .keyboard-navigation *:focus {
      outline: 2px solid #4F46E5 !important;
      outline-offset: 2px !important;
    }

    .skip-link {
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      z-index: 1000;
      text-decoration: none;
      border-radius: 4px;
    }

    .skip-link:focus {
      top: 6px;
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }

    @media (prefers-contrast: high) {
      * {
        border-color: CanvasText !important;
      }
    }
  `;
  
  document.head.appendChild(style);
}