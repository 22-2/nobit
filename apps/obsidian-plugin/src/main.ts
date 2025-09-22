import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "./utils/constants";
import log from "loglevel";
import { type NobitSettings, NobitSettingTab } from "./settings";
import { NobitThreadView, VIEW_TYPE } from "./view/view";
import { activateView, getViewStateByUrl, notify } from "./utils/obsidian";
import { showInputDialog } from "./utils/showInputDialog";
import { isURL } from "./utils/url";

export default class Nobit extends Plugin {
    settings: NobitSettings = DEFAULT_SETTINGS;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new NobitSettingTab(this));
        this.updateLogger();

        this.registerView(VIEW_TYPE, (leaf) => new NobitThreadView(leaf, this));

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
        this.app.workspace.detachLeavesOfType(VIEW_TYPE);
        log.debug("Plugin unloaded");
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
