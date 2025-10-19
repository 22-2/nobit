import log from "loglevel";
import { Notice, Plugin } from "obsidian";
import { DefaultBBSProvider } from "./lib/DefaultBBSProvider";
import { ObsidianFetcher } from "./lib/ObsidianFetcher";
import type { HttpFetcher } from "./lib/libch/fetcher";
import type { BBSProvider } from "./lib/libch/provider";
import { ThreadManager } from "./managers";
import { BoardManager } from "./managers/BoardManager.svelte";
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

	/**
	 * Initialize dependencies (provider, fetcher, and managers).
	 */
	private initializeDependencies(): void {
		const isPlaywright = this.isPlaywrightEnvironment();
		const useDefaultFetcher = (() => {
			if (typeof process !== "undefined") {
				return process.env.USE_DEFAULT_FETCHER === "true";
			}
			return false;
		})();

		if (!isPlaywright || useDefaultFetcher) {
			this.fetcher = new ObsidianFetcher();
			this.provider = new DefaultBBSProvider(this.fetcher);
		} else {
			// Let DefaultBBSProvider auto-detect and use TestFetcher
			this.provider = new DefaultBBSProvider();
			this.fetcher = (this.provider as any).fetcher; // Access the fetcher for compatibility
		}

	}

	/**
	 * Register custom views.
	 */
	private registerViews(): void {
		this.registerView(
			VIEW_TYPE_THREAD,
			(leaf) => {
				const threadManager = new ThreadManager(
					this.app,
					this.provider,
					{},
					(message: string) => new Notice(message),
					async (url: string) => await this.openWithURL(url),
				);
				return new ThreadView(leaf, this, threadManager);
			},
		);
		this.registerView(
			VIEW_TYPE_BOARD,
			(leaf) => {
				const boardManager = new BoardManager(this.app, this.provider, this);
				return new BoardView(leaf, this, boardManager);
			},
		);
	}

	/**
	 * Register plugin commands.
	 */
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
		})
	}

	/**
	 * Handle the 'open-with-url' command.
	 */
	private async handleOpenWithUrlCommand(): Promise<void> {
		const selected = await this.showUrlSelectionDialog();
		if (!selected) return;

		const url = this.extractUrlFromSelection(selected);
		if (url) {
			await this.openWithURL(url);
		}
	}

	/**
	 * Show URL selection dialog with history.
	 */
	private async showUrlSelectionDialog(): Promise<string | null> {
		const historyItems = this.settings.urlHistory
			.slice()
			.reverse()
			.map((item) => `${item.title} - ${item.url}`);

		const instructions = createInstructions({
			上へ: [{ modifiers: [], key: "ArrowUp" }],
			下へ: [{ modifiers: [], key: "ArrowDown" }],
			確定: [{ modifiers: [], key: "Enter" }],
			キャンセル: [{ modifiers: [], key: "Escape" }],
		});

		return await showSelectionDialog({
			app: this.app,
			message: "URLを選択または入力してEnterを押してください",
			items: historyItems,
			placeholder: "URLを選択または入力してEnterを押してください",
			instructions: instructions,
		});
	}

	/**
	 * Extract URL from selection (either from history item or direct input).
	 */
	private extractUrlFromSelection(selected: string): string | undefined {
		if (selected.startsWith("URLを開く: ")) {
			// URL option: "URLを開く: <url>"
			return selected.replace("URLを開く: ", "");
		}
		if (selected.includes(" - ")) {
			// Selection from history: "title - url"
			return selected.split(" - ").pop();
		}
		// Direct URL input
		return selected;
	}

	/**
	 * Check if running in Playwright test environment.
	 */
	private isPlaywrightEnvironment(): boolean {
		if (typeof process !== "undefined" && process.env.PLAYWRIGHT) {
			return true;
		}
		if (typeof window !== "undefined" && (window as any).playwright) {
			return true;
		}
		return false;
	}

	/**
	 * Open a thread view with the given URL.
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

	/**
	 * Add URL to history with title.
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

	/**
	 * Configure logging based on settings.
	 */
	configureLogging(): void {
		toggleLoggerBy(this.settings.showLogger ? "DEBUG" : "ERROR");
	}

	/**
	 * Load plugin settings from disk.
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
	 * Show a notice to the user.
	 */
	showNotice(message: string): void {
		new Notice(message);
	}
}
