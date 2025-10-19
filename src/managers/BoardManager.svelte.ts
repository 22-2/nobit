import log from "loglevel";
import { Menu, setTooltip } from "obsidian";
import type { BBSProvider } from "src/lib/libch/provider";
import { parseBbsUrl } from "src/lib/libch/url";
import type { BoardFilters, SubjectItem } from "../lib/types";
import { BaseManager } from "./BaseManager.svelte";
import { ThreadMenuBuilder } from "./menu/ThreadMenuBuilder";
import type { BoardManagerContext } from "./types";

const logger = log.getLogger("BoardManager");

/**
 * BoardManager manages board-specific state and operations using BBSProvider.
 * This class acts as a bridge between Obsidian's class-based world and Svelte's reactive UI world.
 *
 * Key responsibilities:
 * - Manages reactive state using Svelte 5's $state
 * - Encapsulates all BBS API interactions using BBSProvider
 * - Provides clean interface for Svelte components
 * - Ensures no direct 'obsidian' imports in Svelte components
 * - Implements robust error handling with user-friendly messages
 */
export class BoardManager extends BaseManager {
	// Reactive state using Svelte 5's $state
	boardTitle = $state<string>("");
	threads = $state<SubjectItem[]>([]);
	isLoading = $state<boolean>(false);
	error = $state<string | null>(null);
	boardUrl = $state<string>("");
	filters = $state<BoardFilters>({
		searchText: "",
	});

	// Callback for when board loads successfully
	onBoardLoaded?: () => void;

	// Menu builder for thread context menus
	private menuBuilder: ThreadMenuBuilder;

	// Private board-specific dependencies
	private provider: BBSProvider;
	private showNotice: (message: string) => void;
	private openWithURL: (url: string) => Promise<void>;

	/**
	 * Get filtered threads based on current filter state.
	 * Returns all threads if no filters are active.
	 * Uses $derived for proper Svelte 5 reactivity.
	 */
	filteredThreads = $derived.by(() => {
		if (!this.threads || this.threads.length === 0) {
			return [];
		}

		let threads = this.threads;
		const initialCount = threads.length;

		// Apply search text filter
		if (this.filters.searchText.trim()) {
			const searchLower = this.filters.searchText.toLowerCase();
			threads = threads.filter((thread) =>
				thread.title.toLowerCase().includes(searchLower),
			);
			logger.debug(
				`Search filter '${this.filters.searchText}': ${initialCount} -> ${threads.length} threads`,
			);
		}

		if (initialCount !== threads.length) {
			logger.info(
				`Filtered threads: ${initialCount} -> ${threads.length} (filters: ${JSON.stringify(this.filters)})`,
			);
		}

		return threads;
	});

	constructor(context: BoardManagerContext) {
		super(context);

		this.provider = context.provider;
		this.showNotice = context.showNotice;
		this.openWithURL = context.openWithURL;

		// Initialize menu builder with callbacks
		this.menuBuilder = new ThreadMenuBuilder(
			this.showNotice,
			async (host: string, board: string) => {
				const boardUrl = `https://${host}/${board}/`;
				await this.openWithURL(boardUrl);
			},
			this.openWithURL,
		);
	}

	/**
	 * Load a board from the specified URL using BBSProvider.
	 * Updates reactive state (boardTitle, threads, isLoading, error) that Svelte components can observe.
	 *
	 * @param url - The board URL to load
	 */
	async loadBoard(url: string): Promise<void> {
		this.isLoading = true;
		this.error = null;
		this.boardUrl = url;

		logger.info(`Loading board from URL: ${url}`);

		try {
			const [title, threads] = await Promise.all([
				this.provider.getBoardTitle(url),
				this.provider.getThreads(url),
			]);

			if (!threads) {
				throw new Error("Failed to load board threads");
			}

			this.boardTitle = title;
			this.threads = threads;
			logger.info(
				`Successfully loaded board: ${title} (${threads.length} threads)`,
			);

			// Call the callback if set
			this.onBoardLoaded?.();
		} catch (error) {
			this.handleBoardLoadError(error);
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Refresh the currently loaded board by reloading from its URL.
	 */
	async refreshBoard(): Promise<void> {
		if (!this.boardUrl) {
			logger.warn("Cannot refresh board: no board URL available");
			this.error = "リフレッシュする板がありません。";
			return;
		}

		logger.info(`Refreshing board: ${this.boardUrl}`);
		await this.loadBoard(this.boardUrl);
	}

	/**
	 * Update board filters state.
	 * Creates a new object to ensure Svelte reactivity.
	 *
	 * @param newFilters - Partial filter updates to apply
	 */
	updateFilters(newFilters: Partial<BoardFilters>): void {
		this.filters = { ...this.filters, ...newFilters };
	}

	/**
	 * Open a thread from the board.
	 * Constructs the thread URL from the board URL and thread ID, then opens it.
	 *
	 * @param thread - The SubjectItem representing the thread to open
	 */
	async openThread(thread: SubjectItem): Promise<void> {
		if (!this.boardUrl) {
			logger.error("Cannot open thread: board URL not available");
			this.error = "板が読み込まれていません。";
			return;
		}

		// Parse board URL to get host and board name
		const parsed = parseBbsUrl(this.boardUrl);
		if (!parsed) {
			logger.error(`Cannot parse board URL: ${this.boardUrl}`);
			this.error = "板URLの解析に失敗しました。";
			return;
		}

		// Construct thread URL: https://{host}/test/read.cgi/{board}/{threadId}/
		const threadUrl = `https://${parsed.host}/test/read.cgi/${parsed.board}/${thread.id}/`;
		logger.info(`Opening thread: ${threadUrl}`);

		try {
			await this.openWithURL(threadUrl);
		} catch (error) {
			logger.error("Failed to open thread:", error);
			this.error = this.formatUserFriendlyError(error, "スレッド");
		}
	}

	/**
	 * Handle board loading errors by updating state and logging.
	 *
	 * @param error - The error that occurred
	 */
	private handleBoardLoadError(error: unknown): void {
		this.boardTitle = "";
		this.threads = [];
		this.error = this.formatUserFriendlyError(error, "板");
		logger.error("Failed to load board:", error);
	}

	/**
	 * Show context menu for a thread item.
	 * This method handles Obsidian Menu API, keeping it separated from Svelte components.
	 *
	 * @param thread - The thread to show menu for
	 * @param event - The mouse event that triggered the menu
	 */
	showThreadContextMenu(thread: SubjectItem, event: MouseEvent): void {
		if (!this.boardUrl) {
			logger.error("Cannot show thread menu: board URL not available");
			return;
		}

		const info = this.menuBuilder.extractThreadInfo(thread, this.boardUrl);
		if (!info) {
			logger.error("Failed to extract thread info for menu");
			return;
		}

		// Create and show Obsidian Menu
		const menu = new Menu();
		this.menuBuilder.buildThreadMenu(menu, info);
		menu.showAtMouseEvent(event);
	}

	/**
	 * Set tooltip for a thread element.
	 * This method handles Obsidian setTooltip API, keeping it separated from Svelte components.
	 *
	 * @param element - The HTML element to attach tooltip to
	 * @param thread - The thread to show tooltip for
	 */
	setThreadTooltip(element: HTMLElement, thread: SubjectItem): void {
		// Use Obsidian's setTooltip API
		setTooltip(element, thread.title);
	}
}
