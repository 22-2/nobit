import log from "loglevel";
import type { App } from "obsidian";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BBSProvider } from "../../lib/libch/provider";
import type { Thread, ThreadFilters } from "../../lib/types";
import { ThreadManager } from "../ThreadManager.svelte";
import type { ThreadManagerContext } from "../types";

// Unmock loglevel for this test file to allow proper spying
vi.unmock("loglevel");

// Mock Obsidian App
const createMockApp = (): App => {
	return {} as App;
};

// Mock BBSProvider
const createMockProvider = (): BBSProvider => {
	return {
		id: "mock",
		name: "Mock Provider",
		canHandleUrl: vi.fn(),
		getThreads: vi.fn(),
		getBoardTitle: vi.fn(),
		getThread: vi.fn(),
		post: vi.fn(),
		getBBSMenu: vi.fn(),
	};
};

// Mock data for testing
const mockThread: Thread = {
	id: "1234567890",
	title: "テストスレッド",
	url: "https://example.5ch.net/test/read.cgi/board/1234567890/",
	posts: [
		{
			resNum: 1,
			authorName: "テストユーザー",
			mail: "",
			authorId: "TestID123",
			content: "テスト投稿です",
			date: new Date("2024-01-01T12:00:00Z"),
			references: [],
			replies: [],
			hasImage: false,
			hasExternalLink: false,
			postIdCount: 1,
			siblingPostNumbers: [1],
			imageUrls: [],
		},
	],
};

const mockDatContent =
	"テストユーザー<><>2024/01/01 12:00:00 ID:TestID123<>テスト投稿です<>テストスレッド";
const mockBuffer = new ArrayBuffer(8);

describe("ThreadManager", () => {
	let threadManager: ThreadManager;
	let mockApp: App;
	let mockProvider: BBSProvider;

	beforeEach(() => {
		// Clear all mocks
		vi.clearAllMocks();

		// Mock activeDocument (Obsidian API)
		const mockElement = {
			scrollIntoView: vi.fn(),
			classList: {
				add: vi.fn(),
				remove: vi.fn(),
			},
		};
		(global as any).activeDocument = {
			getElementById: vi.fn().mockReturnValue(mockElement),
		};

		// Create mock instances
		mockApp = createMockApp();
		mockProvider = createMockProvider();

		// Create ThreadManager instance with context
		const context: ThreadManagerContext = {
			app: mockApp,
			provider: mockProvider,
			showNotice: vi.fn(),
			openWithURL: vi.fn(),
			createMenu: vi.fn(),
			setTooltip: vi.fn(),
		};
		threadManager = new ThreadManager(context);
	});

	describe("constructor", () => {
		it("should initialize with correct default state", () => {
			expect(threadManager.thread).toBeNull();
			expect(threadManager.isLoading).toBe(false);
			expect(threadManager.error).toBeNull();
			expect(threadManager.filters).toEqual({
				popular: false,
				image: false,
				video: false,
				external: false,
				internal: false,
				searchText: "",
			});
		});
	});

	describe("loadThread", () => {
		const testUrl =
			"https://example.5ch.net/test/read.cgi/board/1234567890/";

		beforeEach(() => {
			// Setup successful mock responses
			vi.mocked(mockProvider.getThread).mockResolvedValue(mockThread);
		});

		it("should successfully load thread and update reactive state", async () => {
			await threadManager.loadThread(testUrl);

			// Verify the loading flow
			expect(mockProvider.getThread).toHaveBeenCalledWith(testUrl);

			// Verify reactive state updates
			expect(threadManager.thread).toEqual(mockThread);
			expect(threadManager.isLoading).toBe(false);
			expect(threadManager.error).toBeNull();
		});

		it("should set loading state during fetch operation", async () => {
			// Create a promise that we can control
			let resolvePromise: (value: Thread) => void;
			const fetchPromise = new Promise<Thread>((resolve) => {
				resolvePromise = resolve;
			});
			vi.mocked(mockProvider.getThread).mockReturnValue(fetchPromise);

			// Start the load operation
			const loadPromise = threadManager.loadThread(testUrl);

			// Verify loading state is set
			expect(threadManager.isLoading).toBe(true);
			expect(threadManager.error).toBeNull();

			// Complete the fetch
			resolvePromise!(mockThread);
			await loadPromise;

			// Verify loading state is cleared
			expect(threadManager.isLoading).toBe(false);
		});

		it("should clear error state when starting new load", async () => {
			// Set initial error state
			threadManager.error = "Previous error";

			await threadManager.loadThread(testUrl);

			// Verify error was cleared during load
			expect(threadManager.error).toBeNull();
		});

		it("should handle provider errors gracefully", async () => {
			const providerError = new Error("Provider failed to load thread");
			vi.mocked(mockProvider.getThread).mockRejectedValue(providerError);

			await threadManager.loadThread(testUrl);

			// Verify error handling
			expect(threadManager.thread).toBeNull();
			expect(threadManager.isLoading).toBe(false);
			expect(threadManager.error).toBe(
				"スレッドの読み込みに失敗しました: Provider failed to load thread",
			);
		});

		it("should handle null provider result gracefully", async () => {
			vi.mocked(mockProvider.getThread).mockResolvedValue(null as any);

			await threadManager.loadThread(testUrl);

			// Verify error handling for null result
			expect(threadManager.thread).toBeNull();
			expect(threadManager.isLoading).toBe(false);
			expect(threadManager.error).toBe(
				"スレッドの読み込みに失敗しました: Failed to load thread data",
			);
		});
	});

	describe("refreshThread", () => {
		beforeEach(() => {
			// Setup successful mock responses
			vi.mocked(mockProvider.getThread).mockResolvedValue(mockThread);
		});

		it("should reload current thread when thread is loaded", async () => {
			// First load a thread
			await threadManager.loadThread(mockThread.url);

			// Clear the mock calls from initial load
			vi.clearAllMocks();
			vi.mocked(mockProvider.getThread).mockResolvedValue(mockThread);

			// Refresh the thread
			await threadManager.refreshThread();

			// Verify it reloaded the same URL
			expect(mockProvider.getThread).toHaveBeenCalledWith(mockThread.url);
		});

		it("should do nothing when no thread is loaded", async () => {
			// Ensure no thread is loaded
			expect(threadManager.thread).toBeNull();

			await threadManager.refreshThread();

			// Verify no fetch was attempted
			expect(mockProvider.getThread).not.toHaveBeenCalled();
		});

		it("should update reactive state during refresh", async () => {
			// First load a thread
			await threadManager.loadThread(mockThread.url);
			expect(threadManager.thread).toEqual(mockThread);

			// Setup mock for refresh with updated content
			const updatedThread = {
				...mockThread,
				posts: [
					...mockThread.posts,
					{
						resNum: 2,
						authorName: "新しいユーザー",
						mail: "",
						authorId: "NewID456",
						content: "新しい投稿です",
						date: new Date("2024-01-01T13:00:00Z"),
						references: [],
						replies: [],
						hasImage: false,
						hasExternalLink: false,
						postIdCount: 1,
						siblingPostNumbers: [2],
						imageUrls: [],
					},
				],
			};

			vi.clearAllMocks();
			vi.mocked(mockProvider.getThread).mockResolvedValue(updatedThread);

			// Refresh the thread
			await threadManager.refreshThread();

			// Verify state was updated with new content
			expect(threadManager.thread).toEqual(updatedThread);
			expect(threadManager.thread?.posts).toHaveLength(2);
			expect(threadManager.isLoading).toBe(false);
			expect(threadManager.error).toBeNull();
		});

		it("should handle refresh errors gracefully", async () => {
			// First load a thread successfully
			await threadManager.loadThread(mockThread.url);
			expect(threadManager.thread).toEqual(mockThread);

			// Setup mock to fail on refresh
			vi.clearAllMocks();
			const refreshError = new Error("Refresh failed");
			vi.mocked(mockProvider.getThread).mockRejectedValue(refreshError);

			// Refresh the thread
			await threadManager.refreshThread();

			// Verify error handling - thread should be cleared and error set
			expect(threadManager.thread).toBeNull();
			expect(threadManager.isLoading).toBe(false);
			expect(threadManager.error).toBe(
				"スレッドの読み込みに失敗しました: Refresh failed",
			);
		});

		it("should set loading state during refresh operation", async () => {
			// First load a thread
			await threadManager.loadThread(mockThread.url);

			// Create a controllable promise for refresh
			let resolveRefresh: (value: Thread) => void;
			const refreshPromise = new Promise<Thread>((resolve) => {
				resolveRefresh = resolve;
			});

			vi.clearAllMocks();
			vi.mocked(mockProvider.getThread).mockReturnValue(refreshPromise);

			// Start refresh operation
			const refreshOperation = threadManager.refreshThread();

			// Verify loading state is set during refresh
			expect(threadManager.isLoading).toBe(true);
			expect(threadManager.error).toBeNull();

			// Complete the refresh
			resolveRefresh!(mockThread);
			await refreshOperation;

			// Verify loading state is cleared
			expect(threadManager.isLoading).toBe(false);
		});

		it("should preserve thread URL during refresh", async () => {
			const customUrl =
				"https://custom.5ch.net/test/read.cgi/board/9876543210/";
			const customThread = { ...mockThread, url: customUrl };

			// Load thread with custom URL
			vi.mocked(mockProvider.getThread).mockResolvedValue(customThread);
			await threadManager.loadThread(customUrl);

			vi.clearAllMocks();
			vi.mocked(mockProvider.getThread).mockResolvedValue(customThread);

			// Refresh should use the same URL
			await threadManager.refreshThread();

			expect(mockProvider.getThread).toHaveBeenCalledWith(customUrl);
		});
	});

	describe("updateFilters", () => {
		it("should update filters with partial updates", () => {
			const initialFilters = threadManager.filters;
			const updates: Partial<ThreadFilters> = {
				popular: true,
				searchText: "テスト",
			};

			threadManager.updateFilters(updates);

			// Verify filters were updated correctly
			expect(threadManager.filters).toEqual({
				...initialFilters,
				popular: true,
				searchText: "テスト",
			});
		});

		it("should create new filter object for reactivity", () => {
			const originalFilters = threadManager.filters;

			threadManager.updateFilters({ popular: true });

			// Verify a new object was created (important for Svelte reactivity)
			expect(threadManager.filters).not.toBe(originalFilters);
			expect(threadManager.filters.popular).toBe(true);
		});

		it("should handle empty updates", () => {
			const originalFilters = threadManager.filters;

			threadManager.updateFilters({});

			// Should still create new object even with empty updates
			expect(threadManager.filters).not.toBe(originalFilters);
			expect(threadManager.filters).toEqual(originalFilters);
		});

		it("should update individual filter properties correctly", () => {
			// Test each filter property individually
			threadManager.updateFilters({ popular: true });
			expect(threadManager.filters.popular).toBe(true);
			expect(threadManager.filters.image).toBe(false); // Others unchanged

			threadManager.updateFilters({ image: true });
			expect(threadManager.filters.image).toBe(true);
			expect(threadManager.filters.popular).toBe(true); // Previous change preserved

			threadManager.updateFilters({ video: true });
			expect(threadManager.filters.video).toBe(true);

			threadManager.updateFilters({ external: true });
			expect(threadManager.filters.external).toBe(true);

			threadManager.updateFilters({ internal: true });
			expect(threadManager.filters.internal).toBe(true);

			threadManager.updateFilters({ searchText: "検索テキスト" });
			expect(threadManager.filters.searchText).toBe("検索テキスト");
		});

		it("should handle multiple simultaneous filter updates", () => {
			const multipleUpdates: Partial<ThreadFilters> = {
				popular: true,
				image: true,
				video: false,
				searchText: "複数更新テスト",
			};

			threadManager.updateFilters(multipleUpdates);

			expect(threadManager.filters.popular).toBe(true);
			expect(threadManager.filters.image).toBe(true);
			expect(threadManager.filters.video).toBe(false);
			expect(threadManager.filters.external).toBe(false); // Unchanged
			expect(threadManager.filters.internal).toBe(false); // Unchanged
			expect(threadManager.filters.searchText).toBe("複数更新テスト");
		});

		it("should handle filter reset scenarios", () => {
			// First set some filters
			threadManager.updateFilters({
				popular: true,
				image: true,
				searchText: "テスト",
			});

			// Reset to defaults
			threadManager.updateFilters({
				popular: false,
				image: false,
				video: false,
				external: false,
				internal: false,
				searchText: "",
			});

			expect(threadManager.filters).toEqual({
				popular: false,
				image: false,
				video: false,
				external: false,
				internal: false,
				searchText: "",
			});
		});

		it("should preserve immutability for nested state changes", () => {
			const originalFilters = threadManager.filters;
			const firstUpdate = { popular: true };
			const secondUpdate = { searchText: "テスト" };

			threadManager.updateFilters(firstUpdate);
			const afterFirstUpdate = threadManager.filters;

			threadManager.updateFilters(secondUpdate);
			const afterSecondUpdate = threadManager.filters;

			// Each update should create a new object
			expect(originalFilters).not.toBe(afterFirstUpdate);
			expect(afterFirstUpdate).not.toBe(afterSecondUpdate);
			expect(originalFilters).not.toBe(afterSecondUpdate);

			// But content should be preserved correctly
			expect(afterSecondUpdate.popular).toBe(true); // From first update
			expect(afterSecondUpdate.searchText).toBe("テスト"); // From second update
		});

		it("should handle edge cases in search text", () => {
			// Empty string
			threadManager.updateFilters({ searchText: "" });
			expect(threadManager.filters.searchText).toBe("");

			// Special characters
			threadManager.updateFilters({ searchText: "!@#$%^&*()" });
			expect(threadManager.filters.searchText).toBe("!@#$%^&*()");

			// Unicode characters
			threadManager.updateFilters({ searchText: "🎌日本語テスト🎌" });
			expect(threadManager.filters.searchText).toBe("🎌日本語テスト🎌");

			// Very long string
			const longString = "a".repeat(1000);
			threadManager.updateFilters({ searchText: longString });
			expect(threadManager.filters.searchText).toBe(longString);
		});

		it("should maintain state consistency across multiple updates", () => {
			// Simulate rapid filter updates like a user might do
			const updates = [
				{ popular: true },
				{ image: true },
				{ popular: false },
				{ searchText: "test1" },
				{ video: true },
				{ searchText: "test2" },
				{ external: true },
				{ popular: true },
			];

			updates.forEach((update) => {
				threadManager.updateFilters(update);
			});

			// Final state should reflect all changes
			expect(threadManager.filters).toEqual({
				popular: true, // Last update
				image: true, // From earlier update
				video: true, // From earlier update
				external: true, // From earlier update
				internal: false, // Never changed
				searchText: "test2", // Last searchText update
			});
		});
	});

	describe("jumpToPost", () => {
		it("should log jump action for future UI integration", () => {
			const logger = log.getLogger("ThreadManager");
			const loggerSpy = vi
				.spyOn(logger, "debug")
				.mockImplementation(() => {});

			threadManager.jumpToPost(42);

			expect(loggerSpy).toHaveBeenCalledWith("Jumping to post 42");

			loggerSpy.mockRestore();
		});

		it("should handle various post numbers", () => {
			const logger = log.getLogger("ThreadManager");
			const loggerSpy = vi
				.spyOn(logger, "debug")
				.mockImplementation(() => {});

			threadManager.jumpToPost(1);
			threadManager.jumpToPost(999);
			threadManager.jumpToPost(0);

			expect(loggerSpy).toHaveBeenCalledWith("Jumping to post 1");
			expect(loggerSpy).toHaveBeenCalledWith("Jumping to post 999");
			expect(loggerSpy).toHaveBeenCalledWith("Jumping to post 0");

			loggerSpy.mockRestore();
		});

		it("should handle edge case post numbers", () => {
			const logger = log.getLogger("ThreadManager");
			const loggerSpy = vi
				.spyOn(logger, "debug")
				.mockImplementation(() => {});

			// Test negative numbers
			threadManager.jumpToPost(-1);
			expect(loggerSpy).toHaveBeenCalledWith("Jumping to post -1");

			// Test very large numbers
			threadManager.jumpToPost(Number.MAX_SAFE_INTEGER);
			expect(loggerSpy).toHaveBeenCalledWith(
				`Jumping to post ${Number.MAX_SAFE_INTEGER}`,
			);

			// Test decimal numbers (should work as-is for future flexibility)
			threadManager.jumpToPost(42.5);
			expect(loggerSpy).toHaveBeenCalledWith("Jumping to post 42.5");

			loggerSpy.mockRestore();
		});

		it("should not affect thread state", () => {
			// Load a thread first
			const originalThread = mockThread;
			threadManager.thread = originalThread;
			const originalIsLoading = threadManager.isLoading;
			const originalError = threadManager.error;
			const originalFilters = threadManager.filters;

			const logger = log.getLogger("ThreadManager");
			const loggerSpy = vi
				.spyOn(logger, "debug")
				.mockImplementation(() => {});

			// Jump to post should not change any state
			threadManager.jumpToPost(5);

			expect(threadManager.thread).toBe(originalThread);
			expect(threadManager.isLoading).toBe(originalIsLoading);
			expect(threadManager.error).toBe(originalError);
			expect(threadManager.filters).toBe(originalFilters);

			loggerSpy.mockRestore();
		});

		it("should work when no thread is loaded", () => {
			// Ensure no thread is loaded
			expect(threadManager.thread).toBeNull();

			const logger = log.getLogger("ThreadManager");
			const loggerSpy = vi
				.spyOn(logger, "debug")
				.mockImplementation(() => {});

			// Should still work without a loaded thread
			threadManager.jumpToPost(10);

			expect(loggerSpy).toHaveBeenCalledWith("Jumping to post 10");

			loggerSpy.mockRestore();
		});

		it("should handle rapid successive calls", () => {
			const logger = log.getLogger("ThreadManager");
			const loggerSpy = vi
				.spyOn(logger, "debug")
				.mockImplementation(() => {});

			// Simulate rapid navigation
			const postNumbers = [1, 5, 3, 10, 2, 8];
			postNumbers.forEach((num) => {
				threadManager.jumpToPost(num);
			});

			// Verify all calls were logged
			postNumbers.forEach((num) => {
				expect(loggerSpy).toHaveBeenCalledWith(
					`Jumping to post ${num}`,
				);
			});

			expect(loggerSpy).toHaveBeenCalledTimes(postNumbers.length);

			loggerSpy.mockRestore();
		});

		it("should be synchronous operation", () => {
			const logger = log.getLogger("ThreadManager");
			const loggerSpy = vi
				.spyOn(logger, "debug")
				.mockImplementation(() => {});

			const startTime = Date.now();
			threadManager.jumpToPost(100);
			const endTime = Date.now();

			// Should complete immediately (within reasonable time for synchronous operation)
			expect(endTime - startTime).toBeLessThan(10);
			expect(loggerSpy).toHaveBeenCalledWith("Jumping to post 100");

			loggerSpy.mockRestore();
		});

		it("should prepare for future UI integration scenarios", () => {
			const logger = log.getLogger("ThreadManager");
			const loggerSpy = vi
				.spyOn(logger, "debug")
				.mockImplementation(() => {});

			// Test scenarios that UI integration might need to handle

			// Jump to first post
			threadManager.jumpToPost(1);
			expect(loggerSpy).toHaveBeenCalledWith("Jumping to post 1");

			// Jump to a post that might not exist yet (future posts)
			threadManager.jumpToPost(9999);
			expect(loggerSpy).toHaveBeenCalledWith("Jumping to post 9999");

			// Jump to post 0 (might be used for thread top)
			threadManager.jumpToPost(0);
			expect(loggerSpy).toHaveBeenCalledWith("Jumping to post 0");

			loggerSpy.mockRestore();
		});

		it("should maintain consistent behavior across different thread states", () => {
			const logger = log.getLogger("ThreadManager");
			const loggerSpy = vi
				.spyOn(logger, "debug")
				.mockImplementation(() => {});

			// Test with no thread loaded
			threadManager.jumpToPost(1);
			expect(loggerSpy).toHaveBeenCalledWith("Jumping to post 1");

			// Test with thread loaded
			threadManager.thread = mockThread;
			threadManager.jumpToPost(2);
			expect(loggerSpy).toHaveBeenCalledWith("Jumping to post 2");

			// Test with loading state
			threadManager.isLoading = true;
			threadManager.jumpToPost(3);
			expect(loggerSpy).toHaveBeenCalledWith("Jumping to post 3");

			// Test with error state
			threadManager.error = "Some error";
			threadManager.jumpToPost(4);
			expect(loggerSpy).toHaveBeenCalledWith("Jumping to post 4");

			loggerSpy.mockRestore();
		});
	});

	describe("reactive state behavior", () => {
		it("should maintain reactive state consistency during error scenarios", async () => {
			// Start with clean state
			expect(threadManager.isLoading).toBe(false);
			expect(threadManager.error).toBeNull();
			expect(threadManager.thread).toBeNull();

			// Mock a network error
			vi.mocked(mockProvider.getThread).mockRejectedValue(
				new Error("Network error"),
			);

			await threadManager.loadThread("https://example.com/thread");

			// Verify final state is consistent
			expect(threadManager.isLoading).toBe(false);
			expect(threadManager.error).toContain(
				"ネットワーク接続エラーが発生しました。インターネット接続を確認してください。",
			);
			expect(threadManager.thread).toBeNull();
		});

		it("should clear previous thread data on new load attempt", async () => {
			// Load initial thread
			vi.mocked(mockProvider.getThread).mockResolvedValue(mockThread);

			await threadManager.loadThread("https://example.com/thread1");
			expect(threadManager.thread).toEqual(mockThread);

			// Mock failure for second load
			vi.mocked(mockProvider.getThread).mockRejectedValue(
				new Error("Second load failed"),
			);

			await threadManager.loadThread("https://example.com/thread2");

			// Verify previous thread data is cleared and error is set
			expect(threadManager.thread).toBeNull();
			expect(threadManager.error).toContain("Second load failed");
		});
	});
});
