import log from "loglevel";
import { Menu, Notice, Plugin, setTooltip } from "obsidian";
import { DefaultBBSProvider } from "./lib/DefaultBBSProvider";
import { ObsidianFetcher } from "./lib/ObsidianFetcher";
import type { HttpFetcher } from "./lib/libch/fetcher";
import type { BBSProvider } from "./lib/libch/provider";
import { ThreadManager } from "./managers";
import { BoardManager } from "./managers/BoardManager.svelte";
import type {
	BoardManagerContext,
	ThreadManagerContext,
} from "./managers/types";
import { type NobitPluginSettings, NobitSettingTab } from "./settings";
import {
	DEFAULT_SETTINGS,
	VIEW_TYPE_BOARD,
	VIEW_TYPE_THREAD,
} from "./utils/constants";
import { createInstructions } from "./utils/keys";
import { toggleLoggerBy } from "./utils/logger";
import { activateView, getViewStateByUrl, isURL } from "./utils/obsidian";
import { showSelectionDialog } from "./utils/showSelectionDialog";
import { BoardView } from "./view/board/BoardView";
import { ThreadView } from "./view/thread/ThreadView";

const logger = log.getLogger("nobit.main");

export default class NobitPlugin extends Plugin {
	settings: NobitPluginSettings = DEFAULT_SETTINGS;
	provider!: BBSProvider;
	fetcher!: HttpFetcher;

	// ========================================
	// Plugin Lifecycle
	// ========================================

	async onload() {
		await this.loadSettings();
		this.configureLogging();
		this.initializeDependencies();
		this.registerViews();
		this.registerCommands();
		this.addSettingTab(new NobitSettingTab(this));
		logger.debug("Plugin loaded");
	}

	onunload() {
		logger.debug("Plugin unloaded");
	}

	// ========================================
	// Initialization
	// ========================================

	/**
	 * Initialize dependencies (provider and fetcher).
	 * In Playwright environment without USE_DEFAULT_FETCHER flag,
	 * TestFetcher will be auto-detected and used.
	 */
	private initializeDependencies(): void {
		const isPlaywright = this.isPlaywrightEnvironment();
		const useDefaultFetcher = this.shouldUseDefaultFetcher();

		if (!isPlaywright || useDefaultFetcher) {
			this.fetcher = new ObsidianFetcher();
			this.provider = new DefaultBBSProvider(this.fetcher);
		} else {
			// Let DefaultBBSProvider auto-detect and use TestFetcher
			this.provider = new DefaultBBSProvider();
			this.fetcher = (this.provider as any).fetcher;
		}
	}

	private isPlaywrightEnvironment(): boolean {
		if (typeof process !== "undefined" && process.env.PLAYWRIGHT) {
			return true;
		}
		if (typeof window !== "undefined" && (window as any).playwright) {
			return true;
		}
		return false;
	}

	private shouldUseDefaultFetcher(): boolean {
		if (typeof process !== "undefined") {
			return process.env.USE_DEFAULT_FETCHER === "true";
		}
		return false;
	}

	// ========================================
	// View Registration
	// ========================================

	private registerViews(): void {
		this.registerView(VIEW_TYPE_THREAD, (leaf) => {
			const threadManager = new ThreadManager(
				this.createManagerContext(),
			);
			return new ThreadView(leaf, this, threadManager);
		});

		this.registerView(VIEW_TYPE_BOARD, (leaf) => {
			const boardManager = new BoardManager(this.createManagerContext());
			return new BoardView(leaf, this, boardManager);
		});
	}

	/**
	 * Create context for managers with all required dependencies.
	 * This context is compatible with both ThreadManager and BoardManager
	 * since they share the same structure.
	 */
	private createManagerContext(): ThreadManagerContext & BoardManagerContext {
		return {
			app: this.app,
			provider: this.provider,
			showNotice: (message: string) => new Notice(message),
			openWithURL: async (url: string) => await this.openWithURL(url),
			createMenu: () => new Menu(),
			setTooltip: (element: HTMLElement, tooltip: string) =>
				setTooltip(element, tooltip),
		};
	}

	// ========================================
	// Command Registration
	// ========================================

	private registerCommands(): void {
		this.addCommand({
			id: "open-with-url",
			name: "Open with-url",
			callback: () => this.handleOpenWithUrlCommand(),
		});

		this.addCommand({
			id: "open-eddibb.cc",
			name: "Open eddibb.cc",
			callback: () => {
				this.openWithURL("https://bbs.eddibb.cc/liveedge");
			},
		});
	}

	/**
	 * Handle the 'open-with-url' command by showing URL selection dialog.
	 */
	private async handleOpenWithUrlCommand(): Promise<void> {
		const selected = await this.showUrlSelectionDialog();
		if (!selected) return;

		const url = this.extractUrlFromSelection(selected);
		if (url) {
			await this.openWithURL(url);
		}
	}

	// ========================================
	// URL Selection & History
	// ========================================

	/**
	 * Show URL selection dialog with history items.
	 * User can select from history or input a new URL.
	 */
	private async showUrlSelectionDialog(): Promise<string | null> {
		const historyItems = this.getFormattedHistoryItems();
		const instructions = this.createDialogInstructions();

		return await showSelectionDialog({
			app: this.app,
			message: "URLを選択または入力してEnterを押してください",
			items: historyItems,
			placeholder: "URLを選択または入力してEnterを押してください",
			instructions: instructions,
		});
	}

	/**
	 * Get formatted history items for display (title - url).
	 * Items are reversed to show most recent first.
	 */
	private getFormattedHistoryItems(): string[] {
		return this.settings.urlHistory
			.slice()
			.reverse()
			.map((item) => `${item.title} - ${item.url}`);
	}

	/**
	 * Create keyboard instructions for the selection dialog.
	 */
	private createDialogInstructions() {
		return createInstructions({
			上へ: [{ modifiers: [], key: "ArrowUp" }],
			下へ: [{ modifiers: [], key: "ArrowDown" }],
			確定: [{ modifiers: [], key: "Enter" }],
			キャンセル: [{ modifiers: [], key: "Escape" }],
		});
	}

	/**
	 * Extract URL from selection string.
	 * Handles three formats:
	 * 1. "URLを開く: <url>" - from URL option
	 * 2. "title - url" - from history selection
	 * 3. "<url>" - direct URL input
	 */
	private extractUrlFromSelection(selected: string): string | undefined {
		if (selected.startsWith("URLを開く: ")) {
			return selected.replace("URLを開く: ", "");
		}
		if (selected.includes(" - ")) {
			return selected.split(" - ").pop();
		}
		return selected;
	}

	/**
	 * Add URL to history with title and timestamp.
	 * Maintains a maximum of 20 history items.
	 */
	async addToUrlHistory(url: string, title: string): Promise<void> {
		const MAX_HISTORY = 20;

		// Remove duplicate if exists
		this.settings.urlHistory = this.settings.urlHistory.filter(
			(item) => item.url !== url,
		);

		// Add new item at the end
		this.settings.urlHistory.push({
			url,
			title,
			timestamp: Date.now(),
		});

		// Keep only the last MAX_HISTORY items
		if (this.settings.urlHistory.length > MAX_HISTORY) {
			this.settings.urlHistory =
				this.settings.urlHistory.slice(-MAX_HISTORY);
		}

		await this.saveSettings();
	}

	// ========================================
	// View Management
	// ========================================

	/**
	 * Open a view (thread or board) with the given URL.
	 * Validates URL, determines view type, and adds to history.
	 */
	async openWithURL(inputUrl: string): Promise<void> {
		if (!inputUrl || !isURL(inputUrl)) {
			return;
		}

		const state = getViewStateByUrl(inputUrl, log.debug);

		if (!state) {
			return void new Notice("Invalid URL");
		}

		const viewState = {
			...state,
			url: inputUrl,
			active: true,
		};

		const view = await activateView(
			this.app.workspace.getLeaf.bind(this.app.workspace),
			{
				type: state.type,
				state: viewState,
			},
		);
		this.app.workspace.revealLeaf(view.leaf);

		// Save to history
		const title =
			(state.state as any).title || state.state.threadId || inputUrl;
		await this.addToUrlHistory(inputUrl, title);
	}

	// ========================================
	// Settings Management
	// ========================================

	/**
	 * Load plugin settings from disk and merge with defaults.
	 */
	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	/**
	 * Save plugin settings to disk.
	 */
	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	/**
	 * Configure logging level based on settings.
	 * DEBUG when showLogger is true, ERROR otherwise.
	 */
	configureLogging(): void {
		toggleLoggerBy(this.settings.showLogger ? "DEBUG" : "ERROR");
	}
}
