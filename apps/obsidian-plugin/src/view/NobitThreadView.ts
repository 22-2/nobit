// E:\Desktop\coding\my-projects-02\nobit-test\apps\obsidian-plugin\src\view\NobitThreadView.ts
import { createThreadDataStore } from "@nobit/ui/stores/threadDataStore.svelte.ts";
import ThreadView from "@nobit/ui/view/thread/ThreadView.svelte";
import log from "loglevel";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import type Nobit from "../main";
import { VIEW_TYPES } from "src/utils/constants";
import { getURL, type ParsedBbsUrl } from "@nobit/libch/core/url";

export class NobitThreadView extends ItemView {
    component: ReturnType<typeof mount> | null = null;
    plugin: Nobit;
    store!: ReturnType<typeof createThreadDataStore> | null;

    constructor(leaf: WorkspaceLeaf, plugin: Nobit) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return VIEW_TYPES.THREAD;
    }

    getDisplayText() {
        return "Svelte View";
    }

    async onOpen() {}

    async setState(state: ParsedBbsUrl, result: unknown): Promise<void> {
        // 既存のストアがあれば、新しいスレッド情報で更新する
        if (this.store) {
            this.store.updateAndLoadThread({
                title: state.threadId || "",
                url: getURL(state),
            });
            return;
        }

        // ストアがなければ新規作成
        this.store = createThreadDataStore({
            logger: {
                error: log.error,
                info: log.info,
                warn: log.warn,
            },
            provider: this.plugin.provider,
            initialThread: {
                title: state.threadId || "",
                url: getURL(state),
            },
        });

        this.component && unmount(this.component);

        this.component = mount(ThreadView, {
            target: this.contentEl,
            props: {
                // storeをそのまま渡す
                store: this.store,
            },
        });
    }

    async onClose() {
        this.component && unmount(this.component);
        this.store = null;
    }
}
