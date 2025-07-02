import '@testing-library/jest-dom';
import React from 'react';

// Global test setup for Jest
console.log('Setting up Jest test environment...');

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds: ReadonlyArray<number> = [];
  
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Setup localStorage mock
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(() => null),
};
global.localStorage = localStorageMock as Storage;

// Setup sessionStorage mock
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(() => null),
};
global.sessionStorage = sessionStorageMock as Storage;

// Set test environment variables
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8000/api';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000/api';
process.env.NEXT_PUBLIC_APP_NAME = 'R.W.S Blog Test';
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

// Mock fetch with proper responses
global.fetch = jest.fn((url, options) => {
  // Mock different responses based on URL
  if (url.toString().includes('/login')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'admin' },
        token: 'test-token'
      }),
      status: 200,
      statusText: 'OK',
    });
  }
  
  if (url.toString().includes('/user') || url.toString().includes('/auth/check')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'admin' }
      }),
      status: 200,
      statusText: 'OK',
    });
  }
  
  if (url.toString().includes('/posts')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 }
      }),
      status: 200,
      statusText: 'OK',
    });
  }
  
  // Default response
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    status: 200,
    statusText: 'OK',
  });
}) as jest.MockedFunction<typeof fetch>;

// Suppress console errors in tests unless they're testing error scenarios
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: React.createFactory() is deprecated') ||
       args[0].includes('Received `true` for a non-boolean attribute `fill`') ||
       args[0].includes('Received `true` for a non-boolean attribute `priority`'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ 
      data: { 
        user: { id: 1, name: 'Test User', email: 'test@example.com' },
        token: 'test-token'
      }
    })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    defaults: {
      headers: { common: {} },
      baseURL: 'http://localhost:8000/api'
    },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
}));

// Mock next/image globally to avoid React warnings
jest.mock('next/image', () => {
  return function MockImage(props: any) {
    // Remove Next.js specific props to avoid React warnings
    const { src, alt, priority, fill, sizes, quality, placeholder, ...imgProps } = props;
    return React.createElement('img', { src, alt, ...imgProps });
  };
});

// Global test cleanup
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});