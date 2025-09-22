import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, VIEW_TYPES } from "./utils/constants";
import log from "loglevel";
import { type NobitSettings, NobitSettingTab } from "./settings";
import { NobitThreadView } from "./view/NobitThreadView";
import { activateView, getViewStateByUrl, notify } from "./utils/obsidian";
import { showInputDialog } from "./utils/showInputDialog";
import { isURL } from "./utils/url";
import { WorkerBBSProvider } from "./utils/WorkerBBSProvider";

export default class Nobit extends Plugin {
    settings: NobitSettings = DEFAULT_SETTINGS;
    provider: WorkerBBSProvider = new WorkerBBSProvider();

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new NobitSettingTab(this));
        this.updateLogger();

        this.registerView(
            VIEW_TYPES.THREAD,
            (leaf) => new NobitThreadView(leaf, this)
        );

        this.addRibbonIcon("dice", "Activate svelte view", () => {
            this.activateView();
        });

        this.addCommand({
            id: "open-with-url",
            name: "Open with-url",
            callback: async () => {
                const inputUrl = await showInputDialog(this.app, {
                    message: "URLを入力してください",
                    placeholder: "URLを入力してください",
                });

                if (!inputUrl || !isURL(inputUrl)) {
                    return;
                }

                const state = getViewStateByUrl(inputUrl, log.debug);

                if (!state) {
                    return notify("Invalid URL");
                }

                activateView(this.app, state);
            },
        });
    }

    onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPES.THREAD);
        log.debug("Plugin unloaded");
    }

    async activateView() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPES.THREAD);

        await this.app.workspace.getRightLeaf(false)?.setViewState({
            type: VIEW_TYPES.THREAD,
            active: true,
        });

        this.app.workspace.revealLeaf(
            this.app.workspace.getLeavesOfType(VIEW_TYPES.THREAD)[0]!
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
