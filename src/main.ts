import log from "loglevel";
import { Notice, Plugin } from "obsidian";
import { DefaultBBSProvider } from "./lib/DefaultBBSProvider";
import { ObsidianFetcher } from "./lib/ObsidianFetcher";
import type { HttpFetcher } from "./lib/libch/fetcher";
import type { BBSProvider } from "./lib/libch/provider";
import { ThreadManager } from "./managers";
import { type NobitPluginSettings, NobitSettingTab } from "./settings";
import { DEFAULT_SETTINGS, VIEW_TYPE_THREAD } from "./utils/constants";
import { toggleLoggerBy } from "./utils/logger";
import { activateView, getViewStateByUrl, isURL } from "./utils/obsidian";
import { showInputDialog } from "./utils/showInputDialog";
import { ThreadView } from "./view/ThreadView";

const logger = log.getLogger("nobit.main");

export default class NobitPlugin extends Plugin {
	settings: NobitPluginSettings = DEFAULT_SETTINGS;
	threadManager!: ThreadManager;
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
		this.addSettingTab(new NobitSettingTab(this));

		this.registerView(
			VIEW_TYPE_THREAD,
			(leaf) => new ThreadView(leaf, this, this.threadManager)
		);

		this.addCommand({
			id: "open-with-url",
			name: "Open with-url",
			callback: async () => {
				const inputUrl = await showInputDialog(this.app, {
					message: "URLを入力してください",
					placeholder: "URLを入力してください",
				});
				if (inputUrl) this.openWithURL(inputUrl);
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

		const view = await (activateView(this.app.workspace.getLeaf.bind(this.app.workspace), {
			type: VIEW_TYPE_THREAD,
			state: {
				...state,
				url: inputUrl,
				active: true,
			},
		}));
		this.app.workspace.revealLeaf(view.leaf);
	}

	configureLogging(): void {
		toggleLoggerBy(this.settings.showLogger ? "DEBUG" : "ERROR");
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
