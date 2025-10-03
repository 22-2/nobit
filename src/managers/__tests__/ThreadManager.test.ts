import { ThreadManager } from "../ThreadManager";
import { ObsidianFetcher } from "../../lib/ObsidianFetcher";
import { DefaultDecoder } from "../../lib/libch/decoder";
import { DefaultParser } from "../../lib/libch/parser";
import type { App } from "obsidian";
import type { Thread, ThreadFilters } from "../../lib/types";

// Mock the dependencies
jest.mock("../../lib/ObsidianFetcher");
jest.mock("../../lib/libch/decoder");
jest.mock("../../lib/libch/parser");

// Mock Obsidian App
const createMockApp = (): jest.Mocked<App> => {
	return {} as jest.Mocked<App>;
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

const mockDatContent = "テストユーザー<><>2024/01/01 12:00:00 ID:TestID123<>テスト投稿です<>テストスレッド";
const mockBuffer = new ArrayBuffer(8);

describe("ThreadManager", () => {
	let threadManager: ThreadManager;
	let mockApp: jest.Mocked<App>;
	let mockFetcher: jest.Mocked<ObsidianFetcher>;
	let mockDecoder: jest.Mocked<DefaultDecoder>;
	let mockParser: jest.Mocked<DefaultParser>;

	beforeEach(() => {
		// Clear all mocks
		jest.clearAllMocks();

		// Create mock instances
		mockApp = createMockApp();
		mockFetcher = new ObsidianFetcher() as jest.Mocked<ObsidianFetcher>;
		mockDecoder = new DefaultDecoder() as jest.Mocked<DefaultDecoder>;
		mockParser = new DefaultParser() as jest.Mocked<DefaultParser>;

		// Setup default mock implementations
		mockFetcher.fetch = jest.fn();
		mockDecoder.decode = jest.fn();
		mockParser.parseThread = jest.fn();

		// Mock the constructors to return our mocked instances
		(ObsidianFetcher as jest.MockedClass<typeof ObsidianFetcher>).mockImplementation(() => mockFetcher);
		(DefaultDecoder as jest.MockedClass<typeof DefaultDecoder>).mockImplementation(() => mockDecoder);
		(DefaultParser as jest.MockedClass<typeof DefaultParser>).mockImplementation(() => mockParser);

		// Create ThreadManager instance
		threadManager = new ThreadManager(mockApp);
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

		it("should initialize dependencies with correct parameters", () => {
			expect(ObsidianFetcher).toHaveBeenCalledWith(300);
			expect(DefaultDecoder).toHaveBeenCalled();
			expect(DefaultParser).toHaveBeenCalled();
		});
	});

	describe("loadThread", () => {
		const testUrl = "https://example.5ch.net/test/read.cgi/board/1234567890/";

		beforeEach(() => {
			// Setup successful mock responses
			mockFetcher.fetch.mockResolvedValue(mockBuffer);
			mockDecoder.decode.mockReturnValue(mockDatContent);
			mockParser.parseThread.mockReturnValue(mockThread);
		});

		it("should successfully load thread and update reactive state", async () => {
			await threadManager.loadThread(testUrl);

			// Verify the loading flow
			expect(mockFetcher.fetch).toHaveBeenCalledWith(testUrl);
			expect(mockDecoder.decode).toHaveBeenCalledWith(mockBuffer);
			expect(mockParser.parseThread).toHaveBeenCalledWith(mockDatContent, "1234567890", testUrl);

			// Verify reactive state updates
			expect(threadManager.thread).toEqual(mockThread);
			expect(threadManager.isLoading).toBe(false);
			expect(threadManager.error).toBeNull();
		});

		it("should set loading state during fetch operation", async () => {
			// Create a promise that we can control
			let resolvePromise: (value: ArrayBuffer) => void;
			const fetchPromise = new Promise<ArrayBuffer>((resolve) => {
				resolvePromise = resolve;
			});
			mockFetcher.fetch.mockReturnValue(fetchPromise);

			// Start the load operation
			const loadPromise = threadManager.loadThread(testUrl);

			// Verify loading state is set
			expect(threadManager.isLoading).toBe(true);
			expect(threadManager.error).toBeNull();

			// Complete the fetch
			resolvePromise!(mockBuffer);
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

		it("should handle network fetch errors gracefully", async () => {
			const networkError = new Error("Network connection failed");
			mockFetcher.fetch.mockRejectedValue(networkError);

			await threadManager.loadThread(testUrl);

			// Verify error handling
			expect(threadManager.thread).toBeNull();
			expect(threadManager.isLoading).toBe(false);
			expect(threadManager.error).toBe("スレッドの読み込みに失敗しました: Network connection failed");
		});

		it("should handle decoder errors gracefully", async () => {
			const decoderError = new Error("Shift-JIS decoding failed");
			mockFetcher.fetch.mockResolvedValue(mockBuffer);
			mockDecoder.decode.mockImplementation(() => {
				throw decoderError;
			});

			await threadManager.loadThread(testUrl);

			// Verify error handling
			expect(threadManager.thread).toBeNull();
			expect(threadManager.isLoading).toBe(false);
			expect(threadManager.error).toBe("スレッドの読み込みに失敗しました: Shift-JIS decoding failed");
		});

		it("should handle parser errors gracefully", async () => {
			const parserError = new Error("DAT parsing failed");
			mockFetcher.fetch.mockResolvedValue(mockBuffer);
			mockDecoder.decode.mockReturnValue(mockDatContent);
			mockParser.parseThread.mockImplementation(() => {
				throw parserError;
			});

			await threadManager.loadThread(testUrl);

			// Verify error handling
			expect(threadManager.thread).toBeNull();
			expect(threadManager.isLoading).toBe(false);
			expect(threadManager.error).toBe("スレッドの読み込みに失敗しました: DAT parsing failed");
		});

		it("should handle null parser result gracefully", async () => {
			mockFetcher.fetch.mockResolvedValue(mockBuffer);
			mockDecoder.decode.mockReturnValue(mockDatContent);
			mockParser.parseThread.mockReturnValue(undefined);

			await threadManager.loadThread(testUrl);

			// Verify error handling for null result
			expect(threadManager.thread).toBeNull();
			expect(threadManager.isLoading).toBe(false);
			expect(threadManager.error).toBe("スレッドの読み込みに失敗しました: Failed to parse thread data");
		});

		it("should extract thread ID correctly from URL", async () => {
			await threadManager.loadThread(testUrl);

			expect(mockParser.parseThread).toHaveBeenCalledWith(
				mockDatContent,
				"1234567890", // Extracted thread ID
				testUrl
			);
		});

		it("should handle URLs without thread ID gracefully", async () => {
			const invalidUrl = "https://example.5ch.net/test/read.cgi/board/";
			
			await threadManager.loadThread(invalidUrl);

			expect(mockParser.parseThread).toHaveBeenCalledWith(
				mockDatContent,
				"unknown", // Fallback for invalid URL
				invalidUrl
			);
		});
	});

	describe("refreshThread", () => {
		beforeEach(() => {
			// Setup successful mock responses
			mockFetcher.fetch.mockResolvedValue(mockBuffer);
			mockDecoder.decode.mockReturnValue(mockDatContent);
			mockParser.parseThread.mockReturnValue(mockThread);
		});

		it("should reload current thread when thread is loaded", async () => {
			// First load a thread
			await threadManager.loadThread(mockThread.url);
			
			// Clear the mock calls from initial load
			jest.clearAllMocks();
			mockFetcher.fetch.mockResolvedValue(mockBuffer);
			mockDecoder.decode.mockReturnValue(mockDatContent);
			mockParser.parseThread.mockReturnValue(mockThread);

			// Refresh the thread
			await threadManager.refreshThread();

			// Verify it reloaded the same URL
			expect(mockFetcher.fetch).toHaveBeenCalledWith(mockThread.url);
		});

		it("should do nothing when no thread is loaded", async () => {
			// Ensure no thread is loaded
			expect(threadManager.thread).toBeNull();

			await threadManager.refreshThread();

			// Verify no fetch was attempted
			expect(mockFetcher.fetch).not.toHaveBeenCalled();
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
	});

	describe("jumpToPost", () => {
		it("should log jump action for future UI integration", () => {
			const consoleSpy = jest.spyOn(console, "log").mockImplementation();
			
			threadManager.jumpToPost(42);

			expect(consoleSpy).toHaveBeenCalledWith("Jumping to post 42");
			
			consoleSpy.mockRestore();
		});

		it("should handle various post numbers", () => {
			const consoleSpy = jest.spyOn(console, "log").mockImplementation();
			
			threadManager.jumpToPost(1);
			threadManager.jumpToPost(999);
			threadManager.jumpToPost(0);

			expect(consoleSpy).toHaveBeenCalledWith("Jumping to post 1");
			expect(consoleSpy).toHaveBeenCalledWith("Jumping to post 999");
			expect(consoleSpy).toHaveBeenCalledWith("Jumping to post 0");
			
			consoleSpy.mockRestore();
		});
	});

	describe("reactive state behavior", () => {
		it("should maintain reactive state consistency during error scenarios", async () => {
			// Start with clean state
			expect(threadManager.isLoading).toBe(false);
			expect(threadManager.error).toBeNull();
			expect(threadManager.thread).toBeNull();

			// Mock a network error
			mockFetcher.fetch.mockRejectedValue(new Error("Network error"));

			await threadManager.loadThread("https://example.com/thread");

			// Verify final state is consistent
			expect(threadManager.isLoading).toBe(false);
			expect(threadManager.error).toContain("Network error");
			expect(threadManager.thread).toBeNull();
		});

		it("should clear previous thread data on new load attempt", async () => {
			// Load initial thread
			mockFetcher.fetch.mockResolvedValue(mockBuffer);
			mockDecoder.decode.mockReturnValue(mockDatContent);
			mockParser.parseThread.mockReturnValue(mockThread);
			
			await threadManager.loadThread("https://example.com/thread1");
			expect(threadManager.thread).toEqual(mockThread);

			// Mock failure for second load
			mockFetcher.fetch.mockRejectedValue(new Error("Second load failed"));

			await threadManager.loadThread("https://example.com/thread2");

			// Verify previous thread data is cleared and error is set
			expect(threadManager.thread).toBeNull();
			expect(threadManager.error).toContain("Second load failed");
		});
	});
});