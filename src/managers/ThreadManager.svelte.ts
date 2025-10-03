import log from "loglevel";
import type { App } from "obsidian";
import { DebugParser } from "../lib/libch/debug-parser";
import type { Thread, ThreadFilters } from "../lib/types";
import { BaseManager, type BaseManagerOptions } from "./BaseManager";
import { ThreadManagerTestHelper } from "./ThreadManagerTestHelper";
import { getErrorMessage, truncateContent } from "./utils";

const logger = log.getLogger("ThreadManager");

/**
 * Constants specific to ThreadManager
 */
const FALLBACK_POST_LIMIT = 10;
const FALLBACK_CONTENT_MAX_LENGTH = 100;
const THREAD_ID_PATTERN = /\/(\d{10})\/?$/;

/**
 * ThreadManager manages thread-specific state and operations using existing 5ch infrastructure.
 * This class acts as a bridge between Obsidian's class-based world and Svelte's reactive UI world.
 *
 * Key responsibilities:
 * - Manages reactive state using Svelte 5's $state
 * - Encapsulates all 5ch API interactions using ObsidianFetcher, DefaultDecoder, and DefaultParser
 * - Provides clean interface for Svelte components
 * - Ensures no direct 'obsidian' imports in Svelte components
 * - Implements robust error handling with retry logic and user-friendly messages
 *
 * MVP Implementation Notes:
 * - Currently designed to work with hardcoded thread URLs for initial testing
 * - Uses bbs.eddibb.cc/livejupiter URLs consistent with existing libch test infrastructure
 * - Will be extended to support dynamic thread loading in future iterations
 */
export class ThreadManager extends BaseManager {
	// Reactive state using Svelte 5's $state
	thread = $state<Thread | null>(null);
	isLoading = $state<boolean>(false);
	error = $state<string | null>(null);
	filters = $state<ThreadFilters>({
		popular: false,
		image: false,
		video: false,
		external: false,
		internal: false,
		searchText: "",
	});

	// Private thread-specific components
	private readonly debugParser: DebugParser;

	constructor(app: App, options: BaseManagerOptions = {}) {
		super(app, options);
		this.debugParser = new DebugParser();
	}

	/**
	 * Load a thread from the specified URL using existing 5ch infrastructure.
	 * Updates reactive state (thread, isLoading, error) that Svelte components can observe.
	 * Implements retry logic with exponential backoff for network failures.
	 *
	 * @param url - The 5ch thread URL to load
	 */
	async loadThread(url: string): Promise<void> {
		this.isLoading = true;
		this.error = null;

		console.log(`🔥 ThreadManager: Loading thread from URL: ${url}`);
		logger.info(`Loading thread from URL: ${url}`);

		try {
			// Use test fixtures when appropriate
			if (ThreadManagerTestHelper.shouldUseTestFixture(url)) {
				console.log(
					`🔥 ThreadManager: Loading test fixture for URL: ${url}`
				);
				const mockData = await ThreadManagerTestHelper.loadTestFixture(
					url
				);
				const threadId = this.extractThreadIdFromUrl(url);
				const parsedThread = this.parseThreadWithFallback(
					mockData,
					threadId,
					url
				);

				if (!parsedThread) {
					throw new Error("Failed to parse test fixture data");
				}

				this.thread = parsedThread;
				console.log(
					`🔥 ThreadManager: Successfully loaded test thread: ${parsedThread.title} (${parsedThread.posts.length} posts)`
				);
				logger.info(
					`Successfully loaded test thread: ${parsedThread.title} (${parsedThread.posts.length} posts)`
				);
				return;
			}

			console.log(`🔥 ThreadManager: Starting fetchWithRetry...`);
			const buffer = await this.fetchWithRetry(url);
			console.log(
				`🔥 ThreadManager: Fetch completed, buffer size: ${buffer.byteLength}`
			);

			const datContent = this.decodeBuffer(buffer);
			console.log(
				`🔥 ThreadManager: Decoded content length: ${datContent.length}`
			);
			console.log(
				`🔥 ThreadManager: First 200 chars of decoded content:`,
				datContent.substring(0, 200)
			);

			const threadId = this.extractThreadIdFromUrl(url);
			console.log(`🔥 ThreadManager: Extracted thread ID: ${threadId}`);

			const parsedThread = this.parseThreadWithFallback(
				datContent,
				threadId,
				url
			);

			if (!parsedThread) {
				throw new Error("Failed to parse thread data");
			}

			this.thread = parsedThread;
			console.log(
				`🔥 ThreadManager: Successfully loaded thread: ${parsedThread.title} (${parsedThread.posts.length} posts)`
			);
			logger.info(
				`Successfully loaded thread: ${parsedThread.title} (${parsedThread.posts.length} posts)`
			);
		} catch (error) {
			console.error(`🔥 ThreadManager: Error loading thread:`, error);
			this.handleThreadLoadError(error);
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Refresh the currently loaded thread by reloading from its URL.
	 * Uses the same retry logic and error handling as loadThread.
	 */
	async refreshThread(): Promise<void> {
		if (!this.thread?.url) {
			logger.warn("Cannot refresh thread: no thread URL available");
			this.error = "リフレッシュするスレッドがありません。";
			return;
		}

		logger.info(`Refreshing thread: ${this.thread.url}`);
		await this.loadThread(this.thread.url);
	}

	/**
	 * Update thread filters state.
	 * Creates a new object to ensure Svelte reactivity.
	 *
	 * @param newFilters - Partial filter updates to apply
	 */
	updateFilters(newFilters: Partial<ThreadFilters>): void {
		this.filters = { ...this.filters, ...newFilters };
	}

	/**
	 * Jump to a specific post number within the thread.
	 * This method can be extended to handle UI scrolling in the future.
	 *
	 * @param resNumber - The post number to jump to
	 */
	jumpToPost(resNumber: number): void {
		// For now, this is a placeholder for future UI integration
		// The actual scrolling logic will be handled by Svelte components
		console.log(`Jumping to post ${resNumber}`);
	}

	/**
	 * Handle thread loading errors by updating state and logging.
	 *
	 * @param error - The error that occurred
	 */
	private handleThreadLoadError(error: unknown): void {
		this.thread = null;
		this.error = this.formatUserFriendlyError(error, "スレッド");
		logger.error("Failed to load thread:", error);
	}

	/**
	 * Parse thread data with fallback error handling.
	 * Only uses fallback parsing for specific error conditions to maintain test compatibility.
	 *
	 * @param datContent - The DAT file content
	 * @param threadId - The thread ID
	 * @param url - The thread URL
	 * @returns Parsed thread or null if parsing fails
	 */
	private parseThreadWithFallback(
		datContent: string,
		threadId: string,
		url: string
	): Thread | null {
		try {
			// Use debug parser for detailed logging
			console.log("DEBUG: Using debug parser for detailed analysis");

			// Check post count and adjust logging level
			const lineCount = datContent.split("\n").length;
			if (lineCount > 100) {
				// Disable verbose logging for large datasets
				(this.debugParser as any).verboseLogging = false;
				console.log(
					`DEBUG: Large dataset detected (${lineCount} lines), reducing log verbosity`
				);
			}

			return (
				this.debugParser.parseThread(datContent, threadId, url) || null
			);
		} catch (error) {
			logger.warn(
				"Primary thread parsing failed:",
				getErrorMessage(error)
			);

			if (this.shouldUseFallbackParsing(error)) {
				return this.attemptFallbackParsing(
					datContent,
					threadId,
					url,
					error
				);
			}

			throw error;
		}
	}

	/**
	 * Check if fallback parsing should be used based on error type.
	 *
	 * @param error - The error to check
	 * @returns True if fallback parsing should be attempted
	 */
	private shouldUseFallbackParsing(error: unknown): boolean {
		const message = getErrorMessage(error);
		return message.includes("network") || message.includes("timeout");
	}

	/**
	 * Attempt fallback parsing with minimal thread structure.
	 *
	 * @param datContent - The DAT file content
	 * @param threadId - The thread ID
	 * @param url - The thread URL
	 * @param originalError - The original parsing error
	 * @returns Parsed thread or null
	 */
	private attemptFallbackParsing(
		datContent: string,
		threadId: string,
		url: string,
		originalError: unknown
	): Thread | null {
		try {
			const lines = datContent.split("\n").filter((line) => line.trim());
			if (lines.length === 0) {
				throw originalError;
			}

			const fallbackThread = this.createFallbackThread(
				lines,
				threadId,
				url
			);
			logger.info(
				"Fallback parsing succeeded with minimal thread structure"
			);
			return fallbackThread;
		} catch (fallbackError) {
			logger.error("Fallback parsing also failed:", fallbackError);
			throw originalError;
		}
	}

	/**
	 * Create a minimal fallback thread structure.
	 *
	 * @param lines - Content lines
	 * @param threadId - Thread ID
	 * @param url - Thread URL
	 * @returns Minimal thread structure
	 */
	private createFallbackThread(
		lines: string[],
		threadId: string,
		url: string
	): Thread {
		return {
			id: threadId,
			title: `スレッド ${threadId}`,
			url: url,
			posts: lines.slice(0, FALLBACK_POST_LIMIT).map((line, index) => ({
				resNum: index + 1,
				authorName: "名無しさん",
				mail: "",
				authorId: "",
				content: truncateContent(line, FALLBACK_CONTENT_MAX_LENGTH),
				date: new Date(),
				references: [],
				replies: [],
				hasImage: false,
				hasExternalLink: false,
				postIdCount: 1,
				siblingPostNumbers: [index + 1],
				imageUrls: [],
			})),
		};
	}

	/**
	 * Extract thread ID from a 5ch thread URL.
	 *
	 * @param url - The thread URL
	 * @returns The extracted thread ID
	 */
	private extractThreadIdFromUrl(url: string): string {
		const match = url.match(THREAD_ID_PATTERN);
		return match?.[1] || "unknown";
	}
}
