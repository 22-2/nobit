import log from "loglevel";
import { Plugin } from "obsidian";
import { DefaultBBSProvider } from "./lib/DefaultBBSProvider";
import { ObsidianFetcher } from "./lib/ObsidianFetcher";
import type { HttpFetcher } from "./lib/libch/fetcher";
import type { BBSProvider } from "./lib/libch/provider";
import { ThreadManager } from "./managers";
import { type NobitPluginSettings, NobitSettingTab } from "./settings";
import { DEFAULT_SETTINGS, VIEW_TYPE_THREAD } from "./utils/constants";
import { toggleLoggerBy } from "./utils/logger";
import { activateView } from "./utils/obsidian";
import { ThreadView } from "./view/ThreadView";

export const logger = log.getLogger("nobit.main");

export default class NobitPlugin extends Plugin {
	settings: NobitPluginSettings = DEFAULT_SETTINGS;
	threadManager!: ThreadManager;
	provider!: BBSProvider;
	fetcher!: HttpFetcher;

	async onload() {
		await this.loadSettings();
		this.configureLogging();
		this.fetcher = new ObsidianFetcher();
		this.provider = new DefaultBBSProvider(this.fetcher);
		this.threadManager = new ThreadManager(this.app, this.provider);
		this.addSettingTab(new NobitSettingTab(this));

		this.registerView(
			VIEW_TYPE_THREAD,
			(leaf) => new ThreadView(leaf, this, this.threadManager)
		);

		this.addCommand({
			id: "open-nobit-test-thread",
			name: "Open Nobit Test Thread",
			callback: () => {
				this.activateThreadView();
			},
		});
		logger.debug("Plugin loaded");
	}

	onunload() {
		logger.debug("Plugin unloaded");
	}

	private activateThreadView() {
		activateView(this.app.workspace.getLeaf.bind(this.app.workspace), {
			type: VIEW_TYPE_THREAD,
		});
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
