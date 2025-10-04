import log from "loglevel";
import { Plugin } from "obsidian";
import { DefaultParser, type Parser } from "./lib/libch/parser";
import { ThreadManager } from "./managers";
import { type NobitPluginSettings, NobitSettingTab } from "./settings";
import {
	DEFAULT_SETTINGS,
	VIEW_TYPE_BROWSER,
	VIEW_TYPE_THREAD,
} from "./utils/constants";
import { toggleLoggerBy } from "./utils/logger";
import { activateView } from "./utils/obsidian";
import { ThreadView } from "./view/ThreadView";
import { BrowserView } from "./view/view";

export const logger = log.getLogger("nobit.main");

export default class NobitPlugin extends Plugin {
	settings: NobitPluginSettings = DEFAULT_SETTINGS;
	threadManager!: ThreadManager;
	parser!: Parser;

	async onload() {
		await this.loadSettings();
		this.configureLogging();
		this.parser = new DefaultParser();
		this.threadManager = new ThreadManager(this.app, this.parser);
		this.addSettingTab(new NobitSettingTab(this));

		this.registerView(
			VIEW_TYPE_BROWSER,
			(leaf) => new BrowserView(leaf, this)
		);

		this.registerView(
			VIEW_TYPE_THREAD,
			(leaf) => new ThreadView(leaf, this, this.threadManager)
		);

		this.addRibbonIcon("dice", "Activate browser view", () => {
			this.activateView();
		});

		this.addCommand({
			id: "open-browser-view",
			name: "Open Browser View",
			callback: () => {
				this.activateView();
			},
		});

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

	private activateView() {
		activateView(this.app.workspace.getLeaf.bind(this.app.workspace), {
			type: VIEW_TYPE_BROWSER,
		});
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
