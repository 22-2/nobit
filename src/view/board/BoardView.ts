import log from "loglevel";
import { Scope, type WorkspaceLeaf } from "obsidian";
import type NobitPlugin from "../../main";
import { BoardManager } from "../../managers/BoardManager.svelte";
import { ICON_BOARD, VIEW_TYPE_BOARD } from "../../utils/constants";
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
		return ICON_BOARD;
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

	async onOpen(): Promise<void> {
		await super.onOpen();
		this.scope = new Scope(this.scope!);
		this.addAction("refresh-cw", "スレッド一覧を更新", () =>
			this.manager.refreshBoard(),
		);
		this.addAction("filter", "フィルターの表示／非表示", () => {
			this.manager.toggleFilterVisibility();
		});
		this.scope?.register(["Ctrl"], "f", () => {
			this.manager.toggleFilterVisibility();
			setTimeout(() => {
				this.containerEl.find("input.search-input").focus();
			});
		});
	}

	async loadContent(url: string): Promise<void> {
		logger.debug("Navigating to board from URL:", url);
		await this.manager.loadBoard(url);
	}
}
