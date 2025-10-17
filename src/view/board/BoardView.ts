import log from "loglevel";
import type { WorkspaceLeaf } from "obsidian";
import type NobitPlugin from "../../main";
import { BoardManager } from "../../managers/BoardManager.svelte";
import { VIEW_TYPE_BOARD } from "../../utils/constants";
import { BaseView, type BaseViewState } from "../BaseView";
import BoardViewComponent from "./BoardViewComponent.svelte";

const logger = log.getLogger("BoardView");

interface BoardViewState extends BaseViewState {}

/**
 * BoardView extends BaseView to provide board-specific functionality.
 *
 * This class:
 * - Configures board-specific view type, icon, and title
 * - Delegates board loading to BoardManager
 * - Injects BoardManager into Svelte component tree via context
 */
export class BoardView extends BaseView<BoardManager, BoardViewState> {
	constructor(
		leaf: WorkspaceLeaf,
		plugin: NobitPlugin,
		boardManager: BoardManager,
	) {
		super(leaf, plugin, boardManager);
	}

	getViewType(): string {
		return VIEW_TYPE_BOARD;
	}

	getIcon(): string {
		return "layout-list";
	}

	getDefaultTitle(): string {
		return "5ch Board";
	}

	getManagerContextKey(): string {
		return "boardManager";
	}

	getComponentClass(): any {
		return BoardViewComponent;
	}

	async loadContent(url: string): Promise<void> {
		logger.debug("Navigating to board from URL:", url);
		await this.manager.loadBoard(url);
	}
}
