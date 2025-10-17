import log from "loglevel";
import { ItemView, type ViewStateResult, WorkspaceLeaf } from "obsidian";
import {
	type EditableItemView,
	EditableTitleBar,
} from "src/components/EditableTitleBar";
import type { ParsedBbsUrl } from "src/lib/libch/url";
import { mount, unmount } from "svelte";
import type NobitPlugin from "../main";
import { BoardManager } from "../managers/BoardManager.svelte";
import { VIEW_TYPE_BOARD } from "../utils/constants";
import BoardViewComponent from "./board/BoardViewComponent.svelte";

const logger = log.getLogger("BoardView");

interface BoardViewState extends ParsedBbsUrl {
	url: string;
	title: string;

	// Compat for obsidian api
	[x: string]: any;
}

/**
 * BoardView extends Obsidian's ItemView to provide a bridge between
 * Obsidian's class-based world and Svelte's reactive UI world.
 *
 * This class:
 * - Initializes BoardManager with Obsidian app instance
 * - Mounts/unmounts Svelte components properly
 * - Injects BoardManager into Svelte component tree via context
 * - Ensures architectural separation (no 'obsidian' imports in Svelte)
 */
export class BoardView extends ItemView implements EditableItemView {
	private component: ReturnType<typeof mount> | null = null;
	private plugin: NobitPlugin;
	private state: BoardViewState | null = null;
	private editableUrlView: EditableTitleBar | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		plugin: NobitPlugin,
		private boardManager: BoardManager,
	) {
		super(leaf);
		this.plugin = plugin;

		// Setup EditableTitleView
		this.editableUrlView = new EditableTitleBar(this, plugin);
		this.editableUrlView.setup();
	}

	getViewType(): string {
		return VIEW_TYPE_BOARD;
	}

	getDisplayText(): string {
		// Return board title if available, otherwise default text
		return this.state?.title || "5ch Board";
	}

	getIcon(): string {
		return "layout-list";
	}

	async onOpen(): Promise<void> {
		await super.onOpen();
		// Initial render to trigger the request
		this.render();
	}

	async setState(
		newState: BoardViewState,
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
		contextMap.set("boardManager", this.boardManager);

		// Mount Svelte component with BoardManager injected via context
		this.component = mount(BoardViewComponent, {
			target: this.contentEl,
			props: {
				initialUrl: this.state.url, // Pass URL to component
				onTitleChange: (title: string) => this.updateTitle(title),
			},
			context: contextMap,
		});
	}

	private updateTitle(title: string): void {
		if (this.state) {
			this.setState({ ...this.state, title });
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

	// EditableTitleView interface implementation
	async navigateToThreadFromUrl(url: string): Promise<void> {
		logger.debug("Navigating to board from URL:", url);
		const state = this.state || {};
		await this.setState({ url, ...state } as BoardViewState);
		// Directly load the board with the new URL
		await this.boardManager.loadBoard(url);
	}

	getURL(): string {
		return this.state?.url || "";
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
