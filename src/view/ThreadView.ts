import { ItemView, WorkspaceLeaf, setIcon } from "obsidian";
import { VIEW_TYPE_THREAD } from "../utils/constants";
import { mount, unmount } from "svelte";
import { setContext } from "svelte";
import type NobitPlugin from "../main";
import { ThreadManager } from "../managers/ThreadManager";
import SimpleThreadViewComponent from "./SimpleThreadViewComponent.svelte";

/**
 * ThreadView extends Obsidian's ItemView to provide a bridge between
 * Obsidian's class-based world and Svelte's reactive UI world.
 * 
 * This class:
 * - Initializes ThreadManager with Obsidian app instance
 * - Mounts/unmounts Svelte components properly
 * - Injects ThreadManager into Svelte component tree via context
 * - Ensures architectural separation (no 'obsidian' imports in Svelte)
 */
export class ThreadView extends ItemView {
	private threadManager: ThreadManager;
	private component: ReturnType<typeof mount> | null = null;
	private plugin: NobitPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: NobitPlugin) {
		super(leaf);
		this.plugin = plugin;
		// Initialize ThreadManager with Obsidian app instance
		this.threadManager = new ThreadManager(this.app);
	}

	getViewType(): string {
		return VIEW_TYPE_THREAD;
	}

	getDisplayText(): string {
		return "5ch Thread";
	}

	getIcon(): string {
		return "messages-square";
	}

	async onOpen(): Promise<void> {
		// Clear any existing content
		this.contentEl.empty();
		
		// Mount simple thread view component
		this.component = mount(SimpleThreadViewComponent, {
			target: this.contentEl,
			props: {}
		});
	}

	async onClose(): Promise<void> {
		// Properly unmount Svelte component and cleanup
		if (this.component) {
			unmount(this.component);
			this.component = null;
		}
		
		// Clear content element
		this.contentEl.empty();
	}
}