import log from "loglevel";
import type { WorkspaceLeaf } from "obsidian";
import { usePopover } from "src/store/usePopover.svelte";
import type NobitPlugin from "../main";
import { ThreadManager } from "../managers/ThreadManager.svelte";
import { VIEW_TYPE_THREAD } from "../utils/constants";
import { BaseView, type BaseViewState } from "./BaseView";
import ThreadViewComponent from "./thread/ThreadViewComponent.svelte";

const logger = log.getLogger("ThreadView");

interface ThreadViewState extends BaseViewState {}

/**
 * ThreadView extends BaseView to provide thread-specific functionality.
 *
 * This class:
 * - Configures thread-specific view type, icon, and title
 * - Delegates thread loading to ThreadManager
 * - Injects ThreadManager and popoverService into Svelte component tree via context
 * - Manages popoverService lifecycle
 */
export class ThreadView extends BaseView<ThreadManager, ThreadViewState> {
	private popoverService = usePopover();

	constructor(
		leaf: WorkspaceLeaf,
		plugin: NobitPlugin,
		threadManager: ThreadManager,
	) {
		super(leaf, plugin, threadManager);
	}

	getViewType(): string {
		return VIEW_TYPE_THREAD;
	}

	getIcon(): string {
		return "messages-square";
	}

	getDefaultTitle(): string {
		return "5ch Thread";
	}

	getManagerContextKey(): string {
		return "threadManager";
	}

	getComponentClass(): any {
		return ThreadViewComponent;
	}

	async loadContent(url: string): Promise<void> {
		logger.debug("Navigating to thread from URL:", url);
		await this.manager.loadThread(url);
	}

	protected getAdditionalContexts(): Map<string, any> {
		const contexts = new Map();
		contexts.set("popoverService", this.popoverService);
		return contexts;
	}

	protected onCloseCleanup(): void {
		// Cleanup popover service
		this.popoverService.destroy();
	}
}
