// E:\Desktop\coding\my-projects-02\nobit\src\managers\ThreadManager.svelte.ts
import log from "loglevel";
import { Menu, setTooltip, type App } from "obsidian";
import { type BBSProvider } from "src/lib/libch/provider";
import { parseBbsUrl } from "../lib/libch/url";
import type { Post, Thread, ThreadFilters } from "../lib/types";
import { BaseManager, type BaseManagerOptions } from "./BaseManager.svelte";
import { PostMenuBuilder } from "./menu/PostMenuBuilder";
import { ThreadMenuBuilder } from "./menu/ThreadMenuBuilder";

const logger = log.getLogger("ThreadManager");

/**
 * Constants specific to ThreadManager
 */
const THREAD_ID_PATTERN = /\/(\d{10})\/?$/;

/**
 * ThreadManager manages thread-specific state and operations using BBSProvider.
 * This class acts as a bridge between Obsidian's class-based world and Svelte's reactive UI world.
 *
 * Key responsibilities:
 * - Manages reactive state using Svelte 5's $state
 * - Encapsulates all BBS API interactions using BBSProvider
 * - Provides clean interface for Svelte components
 * - Ensures no direct 'obsidian' imports in Svelte components
 * - Implements robust error handling with retry logic and user-friendly messages
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
	// Callback for when thread loads successfully
	onThreadLoaded?: () => void;

	// Menu builders for context menus
	private threadMenuBuilder: ThreadMenuBuilder;
	private postMenuBuilder: PostMenuBuilder;

	/**
	 * Get filtered posts based on current filter state.
	 * Returns all posts if no filters are active.
	 * Uses $derived for proper Svelte 5 reactivity.
	 */
	filteredPosts = $derived.by(() => {
		if (!this.thread?.posts) {
			return [];
		}

		let posts = this.thread.posts;
		const initialCount = posts.length;

		// Apply search text filter
		if (this.filters.searchText.trim()) {
			const searchLower = this.filters.searchText.toLowerCase();
			posts = posts.filter(
				(post) =>
					post.authorName.toLowerCase().includes(searchLower) ||
					post.content.toLowerCase().includes(searchLower),
			);
			logger.debug(
				`Search filter '${this.filters.searchText}': ${initialCount} -> ${posts.length} posts`,
			);
		}

		// Apply popular filter (posts with many replies)
		if (this.filters.popular) {
			const beforeCount = posts.length;
			// Consider posts with 5+ replies as popular
			posts = posts.filter((post) => (post.replies?.length ?? 0) >= 5);
			logger.debug(
				`Popular filter: ${beforeCount} -> ${posts.length} posts`,
			);
		}

		// Apply image filter
		if (this.filters.image) {
			const beforeCount = posts.length;
			posts = posts.filter(
				(post) =>
					post.hasImage ||
					(post.imageUrls && post.imageUrls.length > 0),
			);
			logger.debug(
				`Image filter: ${beforeCount} -> ${posts.length} posts`,
			);
		}

		// Apply video filter (currently not supported in Post type, skip for now)
		if (this.filters.video) {
			const beforeCount = posts.length;
			// Video detection would need to be added to the parser
			// For now, we can check if content contains common video URLs
			posts = posts.filter((post) =>
				/youtube\.com|youtu\.be|nicovideo\.jp|nico\.ms/i.test(
					post.content,
				),
			);
			logger.debug(
				`Video filter: ${beforeCount} -> ${posts.length} posts`,
			);
		}

		// Apply external link filter
		if (this.filters.external) {
			const beforeCount = posts.length;
			posts = posts.filter((post) => post.hasExternalLink);
			logger.debug(
				`External filter: ${beforeCount} -> ${posts.length} posts`,
			);
		}

		// Apply internal link filter (anchors/references)
		if (this.filters.internal) {
			const beforeCount = posts.length;
			posts = posts.filter(
				(post) => post.references && post.references.length > 0,
			);
			logger.debug(
				`Internal filter: ${beforeCount} -> ${posts.length} posts`,
			);
		}

		if (initialCount !== posts.length) {
			logger.info(
				`Filtered posts: ${initialCount} -> ${posts.length} (filters: ${JSON.stringify(this.filters)})`,
			);
		}

		return posts;
	});

	// Private thread-specific components
	constructor(
		app: App,
		private provider: BBSProvider,
		protected options: BaseManagerOptions = {},
		private showNotice: (message: string) => void = () => {},
		private openWithURL: (url: string) => Promise<void> = async () => {},
	) {
		super(app, options);

		// Initialize menu builders with callbacks
		this.threadMenuBuilder = new ThreadMenuBuilder(
			showNotice,
			async (host: string, board: string) => {
				const boardUrl = `https://${host}/${board}/`;
				await this.openWithURL(boardUrl);
			},
			this.openWithURL,
		);

		this.postMenuBuilder = new PostMenuBuilder(showNotice);
	}

	/**
	 * Load a thread from the specified URL using BBSProvider.
	 * Updates reactive state (thread, isLoading, error) that Svelte components can observe.
	 * Implements retry logic with exponential backoff for network failures.
	 *
	 * @param url - The thread URL to load
	 */
	async loadThread(url: string): Promise<void> {
		this.isLoading = true;
		this.error = null;

		logger.info(`Loading thread from URL: ${url}`);

		try {
			const thread = await this.provider.getThread(url);

			if (!thread) {
				throw new Error("Failed to load thread data");
			}

			this.thread = thread;
			logger.info(
				`Successfully loaded thread: ${thread.title} (${thread.posts.length} posts)`,
			);

			// Call the callback if set
			this.onThreadLoaded?.();
		} catch (error) {
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
	 * Scrolls to the target post element.
	 *
	 * @param resNumber - The post number to jump to
	 */
	jumpToPost(resNumber: number): void {
		logger.debug(`Jumping to post ${resNumber}`);

		// Find the post element by ID
		const postElement = activeDocument.getElementById(`res-${resNumber}`);
		if (postElement) {
			// Scroll to the post with smooth behavior
			postElement.scrollIntoView({ behavior: "instant", block: "start" });

			// Add a highlight effect
			postElement.classList.add("post-highlight");
			setTimeout(() => {
				postElement.classList.remove("post-highlight");
			}, 2000);
		} else {
			logger.warn(`Post ${resNumber} not found in DOM`);
		}
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
	 * Show context menu for the current thread.
	 * This method handles Obsidian Menu API, keeping it separated from Svelte components.
	 *
	 * @param event - The mouse event that triggered the menu
	 */
	showThreadContextMenu(event: MouseEvent): void {
		if (!this.thread) {
			logger.error("Cannot show thread menu: no thread loaded");
			return;
		}

		const info = this.threadMenuBuilder.extractThreadInfoFromThread(
			this.thread,
		);
		if (!info) {
			logger.error("Failed to extract thread info for menu");
			return;
		}

		// Create and show Obsidian Menu with full thread data for "copy full thread" feature
		const menu = new Menu();
		this.threadMenuBuilder.buildThreadMenu(menu, info, this.thread);
		menu.showAtMouseEvent(event);
	}

	/**
	 * Show context menu for a post item.
	 * This method handles Obsidian Menu API, keeping it separated from Svelte components.
	 *
	 * @param post - The post to show menu for
	 * @param index - The index of the post (0-based)
	 * @param event - The mouse event that triggered the menu
	 */
	showPostContextMenu(post: Post, index: number, event: MouseEvent): void {
		if (!this.thread) {
			logger.error("Cannot show post menu: no thread loaded");
			return;
		}

		const parsed = parseBbsUrl(this.thread.url);
		if (!parsed) {
			logger.error(`Cannot parse thread URL: ${this.thread.url}`);
			return;
		}

		const info = {
			host: parsed.host,
			board: parsed.board,
			threadId: parsed.threadId || "",
			threadTitle: this.thread.title,
			post,
			index,
		};

		// Create and show Obsidian Menu
		const menu = new Menu();
		this.postMenuBuilder.buildPostMenu(menu, info);
		menu.showAtMouseEvent(event);
	}

	/**
	 * Set tooltip for a thread element.
	 * This method handles Obsidian setTooltip API, keeping it separated from Svelte components.
	 *
	 * @param element - The HTML element to attach tooltip to
	 * @param text - The tooltip text to display
	 */
	setTooltip(element: HTMLElement, text: string): void {
		// Use Obsidian's setTooltip API
		setTooltip(element, text);
	}
}
