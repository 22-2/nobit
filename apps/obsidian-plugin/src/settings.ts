import { PluginSettingTab, Setting } from "obsidian";
import type Nobit from "./main";

export interface NobitSettings {
    logLevel: any;
}
export class NobitSettingTab extends PluginSettingTab {
    constructor(public plugin: Nobit) {
        super(plugin.app, plugin);
    }

    display(): void {
        this.containerEl.empty();

        new Setting(this.containerEl).setName("Plugin Settings").setHeading();

        new Setting(this.containerEl)
            .setName("Show Debug Messages")
            .setDesc("Enable or disable debug messages")
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.logLevel === "debug")
                    .onChange(async (val) => {
                        this.plugin.settings.logLevel = val ? "debug" : "info";
                        await this.plugin.saveSettings();
                        this.plugin.updateLogger();
                    });
            });
    }
}
