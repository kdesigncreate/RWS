import { 
  createPostSchema, 
  updatePostSchema, 
  searchPostSchema,
  postFormSchema,
  validateCreatePost,
  validateUpdatePost,
  validateSearchPost,
  validatePostForm,
  postStatusSchema
} from '@/lib/validation/postSchema';

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

describe('searchPostSchema', () => {
  it('should validate valid search parameters', () => {
    const validSearch = {
      search: 'test query',
      status: 'published',
      page: 1,
      limit: 10,
      sort: 'created_at',
      order: 'desc',
    };

    const result = searchPostSchema.safeParse(validSearch);
    expect(result.success).toBe(true);
  });

  it('should use default values when not provided', () => {
    const emptySearch = {};
    const result = searchPostSchema.safeParse(emptySearch);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
      expect(result.data.sort).toBe('created_at');
      expect(result.data.order).toBe('desc');
    }
  });

  it('should validate page boundaries', () => {
    const invalidSearch = { page: 0 };
    const result = searchPostSchema.safeParse(invalidSearch);
    expect(result.success).toBe(false);
  });

  it('should validate limit boundaries', () => {
    const invalidSearch = { limit: 51 };
    const result = searchPostSchema.safeParse(invalidSearch);
    expect(result.success).toBe(false);
  });
});

describe('postFormSchema', () => {
  it('should validate valid form data', () => {
    const validForm = {
      title: 'Form Title',
      content: 'Form content that is long enough',
      excerpt: 'Form excerpt',
      status: 'draft',
      published_at: new Date(),
    };

    const result = postFormSchema.safeParse(validForm);
    expect(result.success).toBe(true);
  });

  it('should allow null published_at', () => {
    const formWithNullDate = {
      title: 'Form Title',
      content: 'Form content that is long enough',
      status: 'draft',
      published_at: null,
    };

    const result = postFormSchema.safeParse(formWithNullDate);
    expect(result.success).toBe(true);
  });
});

describe('validation functions', () => {
  describe('validateCreatePost', () => {
    it('should return success for valid data', () => {
      const validData = {
        title: 'Test Post',
        content: 'This is valid content',
        status: 'draft',
      };

      const result = validateCreatePost(validData);
      expect(result.success).toBe(true);
    });

    it('should return error for invalid data', () => {
      const invalidData = { title: '' };
      const result = validateCreatePost(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('validateUpdatePost', () => {
    it('should return success for valid partial data', () => {
      const validData = { title: 'Updated Title' };
      const result = validateUpdatePost(validData);
      expect(result.success).toBe(true);
    });

    it('should return error for invalid data', () => {
      const invalidData = { id: -1 };
      const result = validateUpdatePost(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('validateSearchPost', () => {
    it('should return success for valid search data', () => {
      const validData = { search: 'test', page: 1 };
      const result = validateSearchPost(validData);
      expect(result.success).toBe(true);
    });

    it('should return error for invalid search data', () => {
      const invalidData = { page: -1 };
      const result = validateSearchPost(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('validatePostForm', () => {
    it('should return success for valid form data', () => {
      const validData = {
        title: 'Form Title',
        content: 'Form content that is long enough',
        status: 'draft',
      };
      const result = validatePostForm(validData);
      expect(result.success).toBe(true);
    });

    it('should return error for invalid form data', () => {
      const invalidData = { title: '' };
      const result = validatePostForm(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('postStatusSchema', () => {
  it('should accept valid statuses', () => {
    expect(postStatusSchema.parse('draft')).toBe('draft');
    expect(postStatusSchema.parse('published')).toBe('published');
  });

  it('should reject invalid statuses', () => {
    expect(() => postStatusSchema.parse('invalid')).toThrow();
  });
}); 