import { ItemView, type ViewStateResult, WorkspaceLeaf } from "obsidian";
import {
	type EditableItemView,
	EditableTitleBar,
} from "src/components/EditableTitleBar";
import type { ParsedBbsUrl } from "src/lib/libch/url";
import { mount, unmount } from "svelte";
import type NobitPlugin from "../main";

export interface BaseViewState extends ParsedBbsUrl {
	url: string;
	title: string;

	// Compat for obsidian api
	[x: string]: any;
}

/**
 * BaseView extends Obsidian's ItemView to provide a bridge between
 * Obsidian's class-based world and Svelte's reactive UI world.
 *
 * This abstract class:
 * - Manages common view lifecycle (mount/unmount)
 * - Handles EditableTitleBar setup
 * - Implements common state management
 * - Provides template methods for subclass customization
 */
export abstract class BaseView<
		TManager,
		TState extends BaseViewState = BaseViewState,
	>
	extends ItemView
	implements EditableItemView
{
	protected component: ReturnType<typeof mount> | null = null;
	protected plugin: NobitPlugin;
	protected state: TState | null = null;
	protected editableUrlView: EditableTitleBar | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		plugin: NobitPlugin,
		protected manager: TManager,
	) {
		super(leaf);
		this.plugin = plugin;

		// Setup EditableTitleBar
		this.editableUrlView = new EditableTitleBar(this, plugin);
		this.editableUrlView.setup();
	}

	// Abstract methods to be implemented by subclasses
	abstract getViewType(): string;
	abstract getIcon(): string;
	abstract getDefaultTitle(): string;
	abstract getManagerContextKey(): string;
	abstract getComponentClass(): any;
	abstract loadContent(url: string): Promise<void>;

	// Hook for additional context setup (e.g., popoverService)
	protected getAdditionalContexts(): Map<string, any> {
		return new Map();
	}

	// Hook for additional cleanup
	protected onCloseCleanup(): void {
		// Override in subclass if needed
	}

	getDisplayText(): string {
		return this.state?.title || this.getDefaultTitle();
	}

	async onOpen(): Promise<void> {
		await super.onOpen();
		// Initial render to trigger the request
		this.render();
	}

	async setState(
		newState: TState,
		result: ViewStateResult = { history: false },
	): Promise<void> {
		const urlChanged = this.state?.url !== newState.url;
		this.state = newState;
		// Re-render only when URL changes
		if (urlChanged) {
			this.render();
			this.editableUrlView?.setText(newState.url);
		}
		await super.setState(newState, result);
	}

	protected render(): void {
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
		contextMap.set(this.getManagerContextKey(), this.manager);

		// Add any additional contexts from subclass
		const additionalContexts = this.getAdditionalContexts();
		for (const [key, value] of additionalContexts) {
			contextMap.set(key, value);
		}

		// Mount Svelte component with Manager injected via context
		this.component = mount(this.getComponentClass(), {
			target: this.contentEl,
			props: {
				initialUrl: this.state.url,
				onTitleChange: (title: string) => this.updateTitle(title),
			},
			context: contextMap,
		});
	}

	protected updateTitle(title: string): void {
		if (this.state) {
			this.setState({ ...this.state, title } as TState);
			(this.leaf as any).updateHeader();
			// Update history with the actual title
			if (this.state.url) {
				this.plugin.addToUrlHistory(this.state.url, title);
			}
		}
	}

	getState(): Record<string, unknown> {
		return this.state || {};
	}

	// EditableItemView interface implementation
	async navigateToThreadFromUrl(url: string): Promise<void> {
		const state = this.state || {};
		await this.setState({ url, ...state } as TState);
		// Directly load content with the new URL
		await this.loadContent(url);
	}

	getURL(): string {
		return this.state?.url || "";
	}

	async onClose(): Promise<void> {
		// Allow subclass to perform additional cleanup
		this.onCloseCleanup();

		// Properly unmount Svelte component and cleanup
		if (this.component) {
			unmount(this.component);
			this.component = null;
		}

		// Clear content element
		this.contentEl.empty();
	}
}
