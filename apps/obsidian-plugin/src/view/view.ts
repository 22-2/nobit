import { ItemView, WorkspaceLeaf } from "obsidian";
import type Nobit from "../main";
import { mount, unmount } from "svelte";
import ThreadView from "@nobit/ui/view/thread/ThreadView.svelte";

export const VIEW_TYPE = "svelte-view";

export class SvelteView extends ItemView {
    component: ReturnType<typeof mount> | null = null;
    plugin: Nobit;

    constructor(leaf: WorkspaceLeaf, plugin: Nobit) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return VIEW_TYPE;
    }

    getDisplayText() {
        return "Svelte View";
    }

    async onOpen() {
        this.component = mount(ThreadView, {
            target: this.contentEl,
            props: {},
        });
    }

    async onClose() {
        this.component && unmount(this.component);
    }
}
