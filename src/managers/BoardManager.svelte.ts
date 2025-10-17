import log from "loglevel";
import type { App } from "obsidian";
import { type BBSProvider } from "src/lib/libch/provider";
import { parseBbsUrl } from "src/lib/libch/url";
import type { SubjectItem } from "../lib/types";
import { BaseManager, type BaseManagerOptions } from "./BaseManager";
import type NobitPlugin from "../main";

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

	// Callback for when board loads successfully
	onBoardLoaded?: () => void;

	constructor(
		app: App,
		private provider: BBSProvider,
		private plugin: NobitPlugin,
		protected options: BaseManagerOptions = {},
	) {
		super(app, options);
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
			await this.plugin.openWithURL(threadUrl);
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
}
