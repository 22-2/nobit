import log from "loglevel";
import { ItemView, WorkspaceLeaf, type ViewStateResult } from "obsidian";
import { EditableTitleBar, type EditableItemView } from "src/components/EditableTitleBar";
import type { ParsedBbsUrl } from "src/lib/libch/url";
import { usePopover } from "src/store/usePopover.svelte";
import { mount, unmount } from "svelte";
import type NobitPlugin from "../main";
import { ThreadManager } from "../managers/ThreadManager.svelte";
import { VIEW_TYPE_THREAD } from "../utils/constants";
import ThreadViewComponent from "./ThreadViewComponent.svelte";

const logger = log.getLogger("ThreadView");

interface ThreadViewState extends ParsedBbsUrl {
	url: string;
	title: string;

	// Compat for obsidian api
	[x: string]: any;
}

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
export class ThreadView extends ItemView implements EditableItemView {
	private component: ReturnType<typeof mount> | null = null;
	private plugin: NobitPlugin;
	private state: ThreadViewState | null = null;
	private editableTitleView: EditableTitleBar | null = null;
	private popoverService = usePopover();

	constructor(
		leaf: WorkspaceLeaf,
		plugin: NobitPlugin,
		private threadManager: ThreadManager
	) {
		super(leaf);
		this.plugin = plugin;
		// Initialize ThreadManager with Obsidian app instance

		// Setup EditableTitleView
		this.editableTitleView = new EditableTitleBar(this, plugin);
		this.editableTitleView.setup();
	}

	getViewType(): string {
		return VIEW_TYPE_THREAD;
	}

	getDisplayText(): string {
		// Return thread title if available, otherwise default text
		return this.threadManager.thread?.title || "5ch Thread";
	}

	getIcon(): string {
		return "messages-square";
	}

	async onOpen(): Promise<void> {
		await super.onOpen();
		// Initial render to trigger the request
		this.render();
	}

	async setState(newState: ThreadViewState, result: ViewStateResult): Promise<void> {
		await super.setState(newState, result);
		const urlChanged = this.state?.url !== newState.url;
		this.state = newState;
		// Re-render only when URL changes
		if (urlChanged) {
			this.render();
		}
	}

	private render(): void {
		if (!this.state) return;

		// Clear any existing content
		this.contentEl.empty();

		// Unmount existing component if any
		if (this.component) {
			unmount(this.component);
			this.component = null;
		}

		// Create a context map for Svelte component
		const contextMap = new Map();
		contextMap.set("threadManager", this.threadManager);
		contextMap.set("popoverService", this.popoverService);

		// Mount Svelte component with ThreadManager and popoverService injected via context
		this.component = mount(ThreadViewComponent, {
			target: this.contentEl,
			props: {
				initialUrl: this.state.url, // Pass URL to component
				onTitleChange: (title: string) => this.updateTitle(title),
			},
			context: contextMap,
		});
	}

	private updateTitle(title: string): void {
		if (this.titleEl) {
			this.titleEl.innerText = title;
			if (this.state) this.state.title = title;
		}
	}

	getState(): Record<string, unknown> {
		return this.state || {};
	}

	// EditableTitleView interface implementation
	async navigateToThreadFromUrl(url: string): Promise<void> {
		logger.debug("Navigating to thread from URL:", url);
		const state = this.state || {};
		await this.setState({ url, ...state } as ThreadViewState, { history: false });
		// Directly load the thread with the new URL
		await this.threadManager.loadThread(url);
	}

	getURL(): string {
		return this.state?.url || "";
	}

	async onClose(): Promise<void> {
		// Cleanup popover service
		this.popoverService.destroy();

		// Properly unmount Svelte component and cleanup
		if (this.component) {
			unmount(this.component);
			this.component = null;
		}

		// Clear content element
		this.contentEl.empty();
	}
}
