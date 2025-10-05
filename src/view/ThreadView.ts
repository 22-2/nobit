import log from "loglevel";
import { ItemView, WorkspaceLeaf, type ViewStateResult } from "obsidian";
import type { ParsedBbsUrl } from "src/lib/libch/url";
import { mount, unmount } from "svelte";
import type NobitPlugin from "../main";
import { ThreadManager } from "../managers/ThreadManager.svelte";
import { VIEW_TYPE_THREAD } from "../utils/constants";
import ThreadViewComponent from "./ThreadViewComponent.svelte";

const logger = log.getLogger("ThreadView");

interface ThreadViewState extends ParsedBbsUrl {
	url: string;

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
export class ThreadView extends ItemView {
	private component: ReturnType<typeof mount> | null = null;
	private plugin: NobitPlugin;
	private state: ThreadViewState | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		plugin: NobitPlugin,
		private threadManager: ThreadManager
	) {
		super(leaf);
		this.plugin = plugin;
		// Initialize ThreadManager with Obsidian app instance
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

	async setState(state: any, result: ViewStateResult): Promise<void> {
		super.setState(state, result);
		this.state = state;
		// Clear any existing content
		this.contentEl.empty();

		// Create a context map for Svelte component
		const contextMap = new Map();
		contextMap.set("threadManager", this.threadManager);

		// Mount Svelte component with ThreadManager injected via context
		this.component = mount(ThreadViewComponent, {
			target: this.contentEl,
			props: {
				initialUrl: state.url, // Pass URL to component
			},
			context: contextMap,
		});
	}

	// @ts-expect-error
	getState(): ThreadViewState | null {
		return this.state;
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
