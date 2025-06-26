const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Next.jsアプリのパスを指定
  dir: './',
})

// Jestのカスタム設定
const customJestConfig = {
  // テスト環境の設定
  testEnvironment: 'jest-environment-jsdom',
  
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // テストファイルのパターン
  testMatch: [
    '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // E2Eテストを除外
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/tests/e2e/',
  ],
  
  // カバレッジの設定
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  
  // カバレッジの閾値
  coverageThreshold: {
    global: {
      branches: 5,     // 段階的に30%まで上げる予定
      functions: 5,    // 段階的に30%まで上げる予定
      lines: 5,        // 段階的に30%まで上げる予定
      statements: 5,   // 段階的に30%まで上げる予定
    },
  },
  
  // モックファイルの場所
  moduleDirectories: ['node_modules', '<rootDir>/'],
  
  // 静的ファイルとモジュールのマッピング
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
  },
  
  // パフォーマンス向上のための設定
  maxWorkers: '50%',
  workerIdleMemoryLimit: '512MB',
  
  // テストの並列実行を有効化
  maxConcurrency: 5,
  
  // タイムアウト設定
  testTimeout: 10000,
  
  // キャッシュを有効化
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
}

// Next.jsのJest設定を作成して返す
module.exports = createJestConfig(customJestConfig)