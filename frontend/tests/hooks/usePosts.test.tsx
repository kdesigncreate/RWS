import { renderHook, act, waitFor } from "@testing-library/react";
import { usePosts } from "@/hooks/usePosts";
import { api } from "@/lib/api";

// APIライブラリをモック
jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  handleApiError: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;
const mockHandleApiError = require("@/lib/api")
  .handleApiError as jest.MockedFunction<any>;

describe("usePosts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトのhandleApiErrorレスポンス
    mockHandleApiError.mockReturnValue({ message: "Test error message" });
  });

  describe("初期状態", () => {
    it("should have correct initial state", () => {
      const { result } = renderHook(() => usePosts());

      expect(result.current.posts).toEqual([]);
      expect(result.current.currentPost).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.pagination).toEqual({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 10,
      });
    });
  });

  describe("fetchPublicPosts", () => {
    it("should fetch public posts successfully", async () => {
      const mockResponse = {
        data: {
          data: [
            { id: 1, title: "Test Post 1", content: "Content 1" },
            { id: 2, title: "Test Post 2", content: "Content 2" },
          ],
          meta: {
            current_page: 1,
            last_page: 1,
            total: 2,
            per_page: 10,
          },
        },
      };

      mockApi.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePosts());

      await act(async () => {
        await result.current.fetchPublicPosts();
      });

      expect(mockApi.get).toHaveBeenCalledWith("/posts", { params: undefined });
      expect(result.current.posts).toEqual(mockResponse.data.data);
      expect(result.current.pagination).toEqual({
        currentPage: 1,
        lastPage: 1,
        total: 2,
        perPage: 10,
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should handle API errors", async () => {
      const mockError = new Error("API Error");
      mockApi.get.mockRejectedValue(mockError);

      const { result } = renderHook(() => usePosts());

      await act(async () => {
        await result.current.fetchPublicPosts();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe("fetchPublicPost", () => {
    it("should fetch single public post successfully", async () => {
      const mockResponse = {
        data: {
          data: { id: 1, title: "Test Post", content: "Content" },
        },
      };

      mockApi.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePosts());

      await act(async () => {
        await result.current.fetchPublicPost(1);
      });

      expect(mockApi.get).toHaveBeenCalledWith("/posts/1");
      expect(result.current.currentPost).toEqual(mockResponse.data.data);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("fetchAdminPosts", () => {
    it("should fetch admin posts successfully", async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 1,
              title: "Admin Post 1",
              content: "Content 1",
              status: "published",
            },
            {
              id: 2,
              title: "Admin Post 2",
              content: "Content 2",
              status: "draft",
            },
          ],
          meta: {
            current_page: 1,
            last_page: 1,
            total: 2,
            per_page: 10,
          },
        },
      };

      mockApi.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePosts());

      await act(async () => {
        await result.current.fetchAdminPosts();
      });

      expect(mockApi.get).toHaveBeenCalledWith("/admin/posts", {
        params: undefined,
      });
      expect(result.current.posts).toEqual(mockResponse.data.data);
      expect(result.current.pagination).toEqual({
        currentPage: 1,
        lastPage: 1,
        total: 2,
        perPage: 10,
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("fetchAdminPost", () => {
    it("should fetch single admin post successfully", async () => {
      const mockResponse = {
        data: {
          data: {
            id: 1,
            title: "Admin Post",
            content: "Content",
            status: "published",
          },
        },
      };

      mockApi.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePosts());

      await act(async () => {
        await result.current.fetchAdminPost(1);
      });

      expect(mockApi.get).toHaveBeenCalledWith("/admin/posts/1");
      expect(result.current.currentPost).toEqual(mockResponse.data.data);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("createPost", () => {
    it("should create post successfully", async () => {
      const mockResponse = {
        data: {
          data: { id: 1, title: "New Post", content: "New Content" },
        },
      };

      const postData = {
        title: "New Post",
        content: "New Content",
        status: "draft" as const,
      };
      mockApi.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePosts());

      let createResult;
      await act(async () => {
        createResult = await result.current.createPost(postData);
      });

      expect(mockApi.post).toHaveBeenCalledWith("/admin/posts", postData);
      expect(result.current.currentPost).toEqual(mockResponse.data.data);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(createResult).toEqual({
        success: true,
        post: mockResponse.data.data,
      });
    });

    it("should handle creation errors", async () => {
      const mockError = new Error("Creation failed");
      mockApi.post.mockRejectedValue(mockError);

      const { result } = renderHook(() => usePosts());

      let createResult;
      await act(async () => {
        createResult = await result.current.createPost({
          title: "Test",
          content: "Content",
          status: "draft",
        });
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(createResult).toEqual({
        success: false,
        error: expect.any(String),
      });
    });
  });

  describe("updatePost", () => {
    it("should update post successfully", async () => {
      const mockResponse = {
        data: {
          data: { id: 1, title: "Updated Post", content: "Updated Content" },
        },
      };

      const updateData = {
        id: 1,
        title: "Updated Post",
        content: "Updated Content",
        status: "published" as const,
      };
      mockApi.put.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePosts());

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updatePost(1, updateData);
      });

      expect(mockApi.put).toHaveBeenCalledWith("/admin/posts/1", updateData);
      expect(result.current.currentPost).toEqual(mockResponse.data.data);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(updateResult).toEqual({
        success: true,
        post: mockResponse.data.data,
      });
    });
  });

  describe("deletePost", () => {
    it("should delete post successfully", async () => {
      mockApi.delete.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => usePosts());

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deletePost(1);
      });

      expect(mockApi.delete).toHaveBeenCalledWith("/admin/posts/1");
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(deleteResult).toEqual({ success: true });
    });
  });

  describe("utility functions", () => {
    it("should clear error", async () => {
      const { result } = renderHook(() => usePosts());

      // エラーを発生させる
      const mockError = new Error("Test error");
      mockApi.get.mockRejectedValue(mockError);

      await act(async () => {
        await result.current.fetchPublicPosts();
      });

      expect(result.current.error).toBe("Test error message");

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it("should clear current post", () => {
      const { result } = renderHook(() => usePosts());

      act(() => {
        result.current.currentPost = { id: 1, title: "Test" } as any;
      });

      act(() => {
        result.current.clearCurrentPost();
      });

      expect(result.current.currentPost).toBeNull();
    });

    it("should reset posts", () => {
      const { result } = renderHook(() => usePosts());

      act(() => {
        result.current.posts = [{ id: 1, title: "Test" }] as any;
        result.current.currentPost = { id: 1, title: "Test" } as any;
        result.current.error = "Test error";
      });

      act(() => {
        result.current.resetPosts();
      });

      expect(result.current.posts).toEqual([]);
      expect(result.current.currentPost).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.pagination).toEqual({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 10,
      });
    });
  });
});
