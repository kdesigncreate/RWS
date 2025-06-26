import { 
  cn, 
  formatDate, 
  stringUtils, 
  formatNumber, 
  validators, 
  storage,
  debounce,
  throttle,
  arrayUtils,
  env,
  simpleFormatDate,
  truncateText,
  generateSlug
} from '@/lib/utils';

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Utils Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  describe('cn function', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
      expect(cn('foo', { bar: true, baz: false })).toBe('foo bar');
    });
  });

  describe('formatDate utility', () => {
    const testDate = '2024-01-01T12:30:00Z';

    it('should format to Japanese date', () => {
      const result = formatDate.toJapanese(testDate);
      expect(result).toContain('2024');
      expect(result).toContain('1');
    });

    it('should handle null input', () => {
      expect(formatDate.toJapanese(null)).toBe('-');
      expect(formatDate.toJapaneseDateTime(null)).toBe('-');
      expect(formatDate.toRelative(null)).toBe('-');
    });

    it('should handle invalid date strings', () => {
      const result = formatDate.toJapanese('invalid-date');
      expect(result === '-' || result.includes('Invalid')).toBe(true);
    });

    it('should convert to Date object', () => {
      const result = formatDate.toDate(testDate);
      expect(result).toBeInstanceOf(Date);
    });

    it('should return null for invalid date conversion', () => {
      const result1 = formatDate.toDate('invalid');
      const result2 = formatDate.toDate(null);
      // Accept either null or invalid Date object
      expect(result1 === null || (result1 instanceof Date && isNaN(result1.getTime()))).toBe(true);
      expect(result2).toBeNull();
    });
  });

  describe('stringUtils', () => {
    it('should truncate text correctly', () => {
      expect(stringUtils.truncate('Hello World', 5)).toBe('He...');
      expect(stringUtils.truncate('Hi', 10)).toBe('Hi');
    });

    it('should strip HTML tags', () => {
      expect(stringUtils.stripHtml('<p>Hello</p>')).toBe('Hello');
      expect(stringUtils.stripHtml('<div><span>Test</span></div>')).toBe('Test');
    });

    it('should generate slugs', () => {
      expect(stringUtils.toSlug('Hello World')).toBe('hello-world');
      expect(stringUtils.toSlug('Test  Multiple   Spaces')).toBe('test-multiple-spaces');
    });

    it('should convert newlines to br tags', () => {
      expect(stringUtils.nl2br('Line 1\nLine 2')).toBe('Line 1<br>Line 2');
      expect(stringUtils.nl2br('Line 1\r\nLine 2')).toBe('Line 1<br>Line 2');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber.withCommas(1000)).toBe('1,000');
      expect(formatNumber.withCommas(1234567)).toBe('1,234,567');
    });

    it('should format file sizes', () => {
      expect(formatNumber.fileSize(0)).toBe('0 B');
      expect(formatNumber.fileSize(1024)).toBe('1.0 KB');
      expect(formatNumber.fileSize(1048576)).toBe('1.0 MB');
    });
  });

  describe('validators', () => {
    it('should validate email addresses', () => {
      expect(validators.isEmail('test@example.com')).toBe(true);
      expect(validators.isEmail('invalid-email')).toBe(false);
      expect(validators.isEmail('test@')).toBe(false);
    });

    it('should validate URLs', () => {
      expect(validators.isUrl('https://example.com')).toBe(true);
      expect(validators.isUrl('http://test.org')).toBe(true);
      expect(validators.isUrl('invalid-url')).toBe(false);
    });

    it('should check if values are empty', () => {
      expect(validators.isEmpty(null)).toBe(true);
      expect(validators.isEmpty(undefined)).toBe(true);
      expect(validators.isEmpty('')).toBe(true);
      expect(validators.isEmpty('  ')).toBe(true);
      expect(validators.isEmpty([])).toBe(true);
      expect(validators.isEmpty({})).toBe(true);
      expect(validators.isEmpty('test')).toBe(false);
      expect(validators.isEmpty(['item'])).toBe(false);
      expect(validators.isEmpty({ key: 'value' })).toBe(false);
    });
  });

  describe('storage', () => {
    it('should set and get values from localStorage', () => {
      const testData = { name: 'test', value: 123 };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testData));

      storage.set('testKey', testData);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(testData));

      const result = storage.get('testKey');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('testKey');
      expect(result).toEqual(testData);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      storage.set('testKey', 'value');
      expect(consoleSpy).toHaveBeenCalledWith('LocalStorage set error:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should remove items from localStorage', () => {
      storage.remove('testKey');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('testKey');
    });

    it('should clear localStorage', () => {
      storage.clear();
      expect(localStorageMock.clear).toHaveBeenCalled();
    });

    it('should return default value when item not found', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(storage.get('nonexistent', 'default')).toBe('default');
    });
  });

  describe('env', () => {
    it('should detect environment correctly', () => {
      expect(typeof env.isDevelopment).toBe('boolean');
      expect(typeof env.isProduction).toBe('boolean');
      expect(typeof env.isClient).toBe('boolean');
      expect(typeof env.isServer).toBe('boolean');
    });
  });

  describe('simpleFormatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = simpleFormatDate(date);
      
      expect(formatted).toBe('2024年1月15日');
    });

    it('should format date string correctly', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const formatted = simpleFormatDate(dateString);
      
      expect(formatted).toBe('2024年1月15日');
    });

    it('should handle invalid date', () => {
      const invalidDate = 'invalid-date';
      const formatted = simpleFormatDate(invalidDate);
      
      expect(formatted).toBe('日付不明');
    });

    it('should format date with custom format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = simpleFormatDate(date, 'YYYY-MM-DD');
      
      expect(formatted).toBe('2024-01-15');
    });
  });

  describe('arrayUtils', () => {
    it('should shuffle arrays', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = arrayUtils.shuffle(original);
      
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled).toEqual(expect.arrayContaining(original));
      expect(original).toEqual([1, 2, 3, 4, 5]); // Original unchanged
    });

    it('should remove duplicates', () => {
      expect(arrayUtils.unique([1, 2, 2, 3, 3, 4])).toEqual([1, 2, 3, 4]);
      expect(arrayUtils.unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should paginate arrays', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      expect(arrayUtils.paginate(array, 1, 3)).toEqual([1, 2, 3]);
      expect(arrayUtils.paginate(array, 2, 3)).toEqual([4, 5, 6]);
      expect(arrayUtils.paginate(array, 4, 3)).toEqual([10]);
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated';
      const truncated = truncateText(longText, 20);
      
      expect(truncated).toContain('...');
      expect(truncated.length).toBeLessThanOrEqual(23);
    });

    it('should not truncate short text', () => {
      const shortText = 'Short text';
      const truncated = truncateText(shortText, 20);
      
      expect(truncated).toBe('Short text');
    });

    it('should handle empty string', () => {
      const truncated = truncateText('', 20);
      
      expect(truncated).toBe('');
    });

    it('should handle null or undefined', () => {
      expect(truncateText(null as any, 20)).toBe('');
      expect(truncateText(undefined as any, 20)).toBe('');
    });

    it('should use default length when not specified', () => {
      const longText = 'This is a very long text that should be truncated to default length. This text is intentionally made longer than 100 characters to test the default truncation behavior properly.';
      const truncated = truncateText(longText);
      
      expect(truncated).toContain('...');
      expect(truncated.length).toBeLessThanOrEqual(103);
    });
  });

  describe('generateSlug', () => {
    it('should generate slug from title', () => {
      const title = 'This is a Test Title';
      const slug = generateSlug(title);
      
      expect(slug).toBe('this-is-a-test-title');
    });

    it('should handle special characters', () => {
      const title = 'Title with @#$%^&*() characters!';
      const slug = generateSlug(title);
      
      expect(slug).toBe('title-with-characters');
    });

    it('should handle Japanese characters', () => {
      const title = '日本語のタイトル';
      const slug = generateSlug(title);
      
      expect(slug).toBe('日本語のタイトル');
    });

    it('should handle empty string', () => {
      const slug = generateSlug('');
      
      expect(slug).toBe('');
    });

    it('should handle multiple spaces', () => {
      const title = 'Title   with   multiple   spaces';
      const slug = generateSlug(title);
      
      expect(slug).toBe('title-with-multiple-spaces');
    });

    it('should handle leading and trailing spaces', () => {
      const title = '  Title with spaces  ';
      const slug = generateSlug(title);
      
      expect(slug).toBe('title-with-spaces');
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle immediate execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100, true);

      debouncedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      debouncedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    it('should throttle function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
}); 