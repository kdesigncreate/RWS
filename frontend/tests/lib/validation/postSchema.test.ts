import { createPostSchema, updatePostSchema } from '@/lib/validation/postSchema';

describe('createPostSchema', () => {
  it('should validate valid post data', () => {
    const validPost = {
      title: 'Test Post',
      content: 'This is test content for minimum length',
      status: 'published',
    };

    const result = createPostSchema.safeParse(validPost);
    expect(result.success).toBe(true);
  });

  it('should require all required fields', () => {
    const invalidPost = {
      // title missing
      content: 'This is test content for minimum length',
      status: 'published',
    };

    const result = createPostSchema.safeParse(invalidPost);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('title');
    }
  });

  it('should validate title length', () => {
    const invalidPost = {
      title: '', // empty title
      content: 'This is test content for minimum length',
      status: 'published',
    };

    const result = createPostSchema.safeParse(invalidPost);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('title');
    }
  });

  it('should validate content length', () => {
    const invalidPost = {
      title: 'Test Post',
      content: 'short', // too short content (needs 10+ chars)
      status: 'published',
    };

    const result = createPostSchema.safeParse(invalidPost);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('content');
    }
  });

  it('should validate status enum', () => {
    const invalidPost = {
      title: 'Test Post',
      content: 'This is test content for minimum length',
      status: 'invalid_status', // invalid status
    };

    const result = createPostSchema.safeParse(invalidPost);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('status');
    }
  });

  it('should accept valid status values', () => {
    const validStatuses = ['draft', 'published'];
    
    validStatuses.forEach(status => {
      const validPost = {
        title: 'Test Post',
        content: 'This is test content for minimum length',
        status,
      };

      const result = createPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });
  });
});

describe('createPostSchema', () => {
  it('should validate valid create post data', () => {
    const validCreatePost = {
      title: 'New Post',
      content: 'This is new content',
      status: 'draft',
    };

    const result = createPostSchema.safeParse(validCreatePost);
    expect(result.success).toBe(true);
  });

  it('should not require id field', () => {
    const validCreatePost = {
      title: 'New Post',
      content: 'This is new content',
      status: 'draft',
    };

    const result = createPostSchema.safeParse(validCreatePost);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });

  it('should validate title length for creation', () => {
    const invalidCreatePost = {
      title: 'A'.repeat(256), // too long title
      content: 'This is new content',
      status: 'draft',
    };

    const result = createPostSchema.safeParse(invalidCreatePost);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('title');
    }
  });

  it('should validate content length for creation', () => {
    const invalidCreatePost = {
      title: 'New Post',
      content: 'short', // too short content (needs 10+ chars)
      status: 'draft',
    };

    const result = createPostSchema.safeParse(invalidCreatePost);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('content');
    }
  });
});

describe('updatePostSchema', () => {
  it('should validate valid update post data', () => {
    const validUpdatePost = {
      title: 'Updated Post',
      content: 'This is updated content for minimum length',
      status: 'published',
    };

    const result = updatePostSchema.safeParse(validUpdatePost);
    expect(result.success).toBe(true);
  });

  it('should make all fields optional', () => {
    const partialUpdate = {
      title: 'Updated Title Only',
    };

    const result = updatePostSchema.safeParse(partialUpdate);
    expect(result.success).toBe(true);
  });

  it('should validate title length when provided', () => {
    const invalidUpdatePost = {
      title: '', // empty title
      content: 'This is updated content',
    };

    const result = updatePostSchema.safeParse(invalidUpdatePost);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('title');
    }
  });

  it('should validate content length when provided', () => {
    const invalidUpdatePost = {
      title: 'Updated Post',
      content: 'short', // too short content
    };

    const result = updatePostSchema.safeParse(invalidUpdatePost);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('content');
    }
  });

  it('should validate status when provided', () => {
    const invalidUpdatePost = {
      status: 'invalid_status',
    };

    const result = updatePostSchema.safeParse(invalidUpdatePost);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('status');
    }
  });
});

describe('Schema edge cases', () => {
  it('should handle null values', () => {
    const nullPost = {
      title: null,
      content: null,
      status: null,
    };

    const result = createPostSchema.safeParse(nullPost);
    expect(result.success).toBe(false);
  });

  it('should handle undefined values', () => {
    const undefinedPost = {
      title: undefined,
      content: undefined,
      status: undefined,
    };

    const result = createPostSchema.safeParse(undefinedPost);
    expect(result.success).toBe(false);
  });

  it('should handle whitespace-only strings', () => {
    const whitespacePost = {
      title: '   ',
      content: '   ',
      status: 'draft',
    };

    const result = createPostSchema.safeParse(whitespacePost);
    expect(result.success).toBe(false);
  });

  it('should handle very long strings', () => {
    const longStringPost = {
      title: 'A'.repeat(255), // exactly at limit
      content: 'A'.repeat(100), // above minimum length
      status: 'draft',
    };

    const result = createPostSchema.safeParse(longStringPost);
    expect(result.success).toBe(true);
  });
}); 