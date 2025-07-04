import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Mock data
const mockUser = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockPosts = [
  {
    id: 1,
    title: "Test Post 1",
    content: "This is test post content 1",
    status: "published",
    user_id: 1,
    user: mockUser,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    title: "Test Post 2",
    content: "This is test post content 2",
    status: "published",
    user_id: 1,
    user: mockUser,
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Define request handlers
export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/api/login`, () => {
    return HttpResponse.json({
      data: {
        user: mockUser,
        token: "mock-jwt-token",
      },
      message: "Login successful",
    });
  }),

  http.post(`${API_BASE_URL}/api/logout`, () => {
    return HttpResponse.json({
      message: "Logged out successfully",
    });
  }),

  http.get(`${API_BASE_URL}/api/user`, ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.includes("Bearer")) {
      return HttpResponse.json(
        {
          message: "Unauthenticated",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      data: mockUser,
    });
  }),

  // Posts endpoints
  http.get(`${API_BASE_URL}/api/posts`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    let filteredPosts = mockPosts;

    if (search) {
      filteredPosts = mockPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(search.toLowerCase()) ||
          post.content.toLowerCase().includes(search.toLowerCase()),
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    return HttpResponse.json({
      data: paginatedPosts,
      meta: {
        current_page: page,
        total: filteredPosts.length,
        per_page: limit,
        last_page: Math.ceil(filteredPosts.length / limit),
      },
    });
  }),

  http.get(`${API_BASE_URL}/api/posts/:id`, ({ params }) => {
    const { id } = params;
    const post = mockPosts.find((p) => p.id === parseInt(id as string));

    if (!post) {
      return HttpResponse.json(
        {
          message: "Post not found",
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      data: post,
    });
  }),

  // Admin endpoints
  http.get(`${API_BASE_URL}/api/admin/posts`, ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.includes("Bearer")) {
      return HttpResponse.json(
        {
          message: "Unauthenticated",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      data: mockPosts,
      meta: {
        current_page: 1,
        total: mockPosts.length,
        per_page: 10,
        last_page: 1,
      },
    });
  }),

  http.post(`${API_BASE_URL}/api/admin/posts`, async ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.includes("Bearer")) {
      return HttpResponse.json(
        {
          message: "Unauthenticated",
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as any;

    return HttpResponse.json(
      {
        data: {
          id: mockPosts.length + 1,
          ...body,
          user_id: mockUser.id,
          user: mockUser,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  }),

  http.put(
    `${API_BASE_URL}/api/admin/posts/:id`,
    async ({ request, params }) => {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.includes("Bearer")) {
        return HttpResponse.json(
          {
            message: "Unauthenticated",
          },
          { status: 401 },
        );
      }

      const { id } = params;
      const post = mockPosts.find((p) => p.id === parseInt(id as string));

      if (!post) {
        return HttpResponse.json(
          {
            message: "Post not found",
          },
          { status: 404 },
        );
      }

      const body = (await request.json()) as any;

      return HttpResponse.json({
        data: {
          ...post,
          ...body,
          updated_at: new Date().toISOString(),
        },
      });
    },
  ),

  http.delete(`${API_BASE_URL}/api/admin/posts/:id`, ({ request, params }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.includes("Bearer")) {
      return HttpResponse.json(
        {
          message: "Unauthenticated",
        },
        { status: 401 },
      );
    }

    const { id } = params;
    const postIndex = mockPosts.findIndex(
      (p) => p.id === parseInt(id as string),
    );

    if (postIndex === -1) {
      return HttpResponse.json(
        {
          message: "Post not found",
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      message: "Post deleted successfully",
    });
  }),

  // Fallback handler for unhandled requests
  http.all("*", ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.json(
      {
        message: "Not found",
      },
      { status: 404 },
    );
  }),
];

// Setup the server
export const server = setupServer(...handlers);
