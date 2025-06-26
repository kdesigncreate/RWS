import { loginSchema, userSchema } from '@/lib/validation/authSchema';

describe('loginSchema', () => {
  it('should validate valid login data', () => {
    const validLogin = {
      email: 'test@example.com',
      password: 'password123',
    };

    const result = loginSchema.safeParse(validLogin);
    expect(result.success).toBe(true);
  });

  it('should require email field', () => {
    const invalidLogin = {
      password: 'password123',
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email');
    }
  });

  it('should require password field', () => {
    const invalidLogin = {
      email: 'test@example.com',
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('password');
    }
  });

  it('should validate email format', () => {
    const invalidLogin = {
      email: 'invalid-email',
      password: 'password123',
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email');
    }
  });

  it('should validate password length', () => {
    const invalidLogin = {
      email: 'test@example.com',
      password: '123', // too short
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('password');
    }
  });

  it('should accept valid email formats', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.jp',
      'user+tag@example.org',
    ];

    validEmails.forEach(email => {
      const validLogin = {
        email,
        password: 'password123',
      };

      const result = loginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid email formats', () => {
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'test@',
      'test.example.com',
    ];

    invalidEmails.forEach(email => {
      const invalidLogin = {
        email,
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });
  });
});

describe('userSchema', () => {
  it('should validate valid user data', () => {
    const validUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      email_verified_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const result = userSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('should require id field', () => {
    const invalidUser = {
      name: 'Test User',
      email: 'test@example.com',
    };

    const result = userSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('id');
    }
  });

  it('should require name field', () => {
    const invalidUser = {
      id: 1,
      email: 'test@example.com',
    };

    const result = userSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name');
    }
  });

  it('should require email field', () => {
    const invalidUser = {
      id: 1,
      name: 'Test User',
    };

    const result = userSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email');
    }
  });

  it('should validate email format in user data', () => {
    const invalidUser = {
      id: 1,
      name: 'Test User',
      email: 'invalid-email',
    };

    const result = userSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email');
    }
  });

  it('should handle optional fields', () => {
    const userWithoutOptional = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
    };

    const result = userSchema.safeParse(userWithoutOptional);
    expect(result.success).toBe(true);
  });

  it('should validate date formats for optional fields', () => {
    const userWithInvalidDates = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      email_verified_at: 'invalid-date',
      created_at: 'invalid-date',
      updated_at: 'invalid-date',
    };

    const result = userSchema.safeParse(userWithInvalidDates);
    expect(result.success).toBe(false);
  });

  it('should accept valid date formats', () => {
    const userWithValidDates = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      email_verified_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const result = userSchema.safeParse(userWithValidDates);
    expect(result.success).toBe(true);
  });
});

describe('Schema edge cases', () => {
  it('should handle empty strings', () => {
    const emptyLogin = {
      email: '',
      password: '',
    };

    const result = loginSchema.safeParse(emptyLogin);
    expect(result.success).toBe(false);
  });

  it('should handle whitespace-only strings', () => {
    const whitespaceLogin = {
      email: '   ',
      password: '   ',
    };

    const result = loginSchema.safeParse(whitespaceLogin);
    expect(result.success).toBe(false);
  });

  it('should handle very long strings', () => {
    const longLogin = {
      email: 'a'.repeat(250) + '@example.com', // 250+12=262文字で制限超過
      password: 'a'.repeat(256), // 256文字で制限超過
    };

    const result = loginSchema.safeParse(longLogin);
    expect(result.success).toBe(false);
  });

  it('should handle null values', () => {
    const nullLogin = {
      email: null,
      password: null,
    };

    const result = loginSchema.safeParse(nullLogin);
    expect(result.success).toBe(false);
  });

  it('should handle undefined values', () => {
    const undefinedLogin = {
      email: undefined,
      password: undefined,
    };

    const result = loginSchema.safeParse(undefinedLogin);
    expect(result.success).toBe(false);
  });
}); 