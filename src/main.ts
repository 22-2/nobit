import log from "loglevel";
import { Notice, Plugin } from "obsidian";
import { DefaultBBSProvider } from "./lib/DefaultBBSProvider";
import { ObsidianFetcher } from "./lib/ObsidianFetcher";
import type { HttpFetcher } from "./lib/libch/fetcher";
import type { BBSProvider } from "./lib/libch/provider";
import { ThreadManager } from "./managers";
import { BoardManager } from "./managers/BoardManager.svelte";
import { type NobitPluginSettings, NobitSettingTab } from "./settings";
import { DEFAULT_SETTINGS, VIEW_TYPE_BOARD, VIEW_TYPE_THREAD } from "./utils/constants";
import { createInstructions } from "./utils/keys";
import { toggleLoggerBy } from "./utils/logger";
import { activateView, getViewStateByUrl, isURL } from "./utils/obsidian";
import { showSelectionDialog } from "./utils/showSelectionDialog";
import { BoardView } from "./view/BoardView";
import { ThreadView } from "./view/ThreadView";

const logger = log.getLogger("nobit.main");

export default class NobitPlugin extends Plugin {
	settings: NobitPluginSettings = DEFAULT_SETTINGS;
	threadManager!: ThreadManager;
	boardManager!: BoardManager;
	provider!: BBSProvider;
	fetcher!: HttpFetcher;

	async onload() {
		await this.loadSettings();
		this.configureLogging();

		// In Playwright environment, let DefaultBBSProvider choose the appropriate fetcher
		const isPlaywright = this.isPlaywrightEnvironment();
		if (!isPlaywright) {
			this.fetcher = new ObsidianFetcher();
			this.provider = new DefaultBBSProvider(this.fetcher);
		} else {
			// Let DefaultBBSProvider auto-detect and use TestFetcher
			this.provider = new DefaultBBSProvider();
			this.fetcher = (this.provider as any).fetcher; // Access the fetcher for compatibility
		}

		this.threadManager = new ThreadManager(this.app, this.provider);
		this.boardManager = new BoardManager(this.app, this.provider);
		this.addSettingTab(new NobitSettingTab(this));

		this.registerView(
			VIEW_TYPE_THREAD,
			(leaf) => new ThreadView(leaf, this, this.threadManager),
		);
		this.registerView(
			VIEW_TYPE_BOARD,
			leaf => new BoardView(leaf, this, this.boardManager)
		)

		this.addCommand({
			id: "open-with-url",
			name: "Open with-url",
			callback: async () => {
				const historyItems = this.settings.urlHistory
					.slice()
					.reverse()
					.map((item) => `${item.title} - ${item.url}`);

				// デフォルトのキー操作ガイドを作成
				const instructions = createInstructions({
					上へ: [{ modifiers: [], key: "ArrowUp" }],
					下へ: [{ modifiers: [], key: "ArrowDown" }],
					確定: [{ modifiers: [], key: "Enter" }],
					キャンセル: [{ modifiers: [], key: "Escape" }],
				});

				const selected = await showSelectionDialog({
					app: this.app,
					message: "URLを選択または入力してEnterを押してください",
					items: historyItems,
					placeholder: "URLを選択または入力してEnterを押してください",
					instructions: instructions,
				});

				if (!selected) return;

				// Check if selected is from history (contains " - ")
				if (selected.includes(" - ")) {
					const url = selected.split(" - ").pop();
					if (url) this.openWithURL(url);
				} else {
					// Treat as direct URL input
					this.openWithURL(selected);
				}
			},
		});
		logger.debug("Plugin loaded");
	}

	onunload() {
		logger.debug("Plugin unloaded");
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

	async openWithURL(inputUrl: string) {
		if (!inputUrl || !isURL(inputUrl)) {
			return;
		}

		const state = getViewStateByUrl(inputUrl, log.debug);

		if (!state) {
			return void new Notice("Invalid URL");
		}

		const view = await activateView(
			this.app.workspace.getLeaf.bind(this.app.workspace),
			{
				type: VIEW_TYPE_THREAD,
				state: {
					...state,
					url: inputUrl,
					active: true,
				},
			},
		);
		this.app.workspace.revealLeaf(view.leaf);

		// Save to history
		const title =
			(state.state as any).title || state.state.threadId || inputUrl;
		await this.addToUrlHistory(inputUrl, title);
	}

	async addToUrlHistory(url: string, title: string) {
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
			this.settings.urlHistory = this.settings.urlHistory.slice(-MAX_HISTORY);
		}

		await this.saveSettings();
	}

	configureLogging(): void {
		toggleLoggerBy(this.settings.showLogger ? "DEBUG" : "ERROR");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
