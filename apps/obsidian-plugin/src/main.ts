import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "./utils/constants";
import log from "loglevel";
import { type NobitSettings, NobitSettingTab } from "./settings";
import { SvelteView, VIEW_TYPE } from "./view/view";

export default class Nobit extends Plugin {
    settings: NobitSettings = DEFAULT_SETTINGS;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new NobitSettingTab(this));
        this.updateLogger();

        this.registerView(VIEW_TYPE, (leaf) => new SvelteView(leaf, this));

        this.addRibbonIcon("dice", "Activate svelte view", () => {
            this.activateView();
        });

        this.addCommand({
            id: "open-svelte-view",
            name: "Open Svelte View",
            callback: () => {
                this.activateView();
            },
        });
    }

    onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE);
        log.debug("Plugin unloaded");
    }

    async activateView() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE);

        await this.app.workspace.getRightLeaf(false)?.setViewState({
            type: VIEW_TYPE,
            active: true,
        });

        this.app.workspace.revealLeaf(
            this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]!
        );
    }

    updateLogger(): void {
        if (this.settings.logLevel === "debug") {
            log.enableAll();
        } else {
            log.disableAll();
        }
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
