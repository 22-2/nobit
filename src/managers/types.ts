import type { App } from "obsidian";
import type { BBSProvider } from "src/lib/libch/provider";
import type NobitPlugin from "../main";

/**
 * Base context interface for all managers.
 * Contains the minimum dependencies required by BaseManager.
 */
export interface BaseManagerContext {
	/**
	 * Obsidian App instance for accessing workspace, vault, and other core APIs.
	 */
	app: App;

	/**
	 * BBS provider for fetching board data from 5ch-compatible boards.
	 */
	provider: BBSProvider;
}

/**
 * Context interface for ThreadManager.
 * Extends BaseManagerContext with thread-specific dependencies.
 */
export interface ThreadManagerContext extends BaseManagerContext {
	/**
	 * Callback to show a notice message to the user.
	 */
	showNotice: (message: string) => void;

	/**
	 * Callback to open a new view with the given URL.
	 */
	openWithURL: (url: string) => Promise<void>;
}

/**
 * Context interface for BoardManager.
 * Extends BaseManagerContext with board-specific dependencies.
 */
export interface BoardManagerContext extends BaseManagerContext {
	/**
	 * Plugin instance for accessing plugin-level functionality
	 * (e.g., showNotice, openWithURL, settings).
	 */
	plugin: NobitPlugin;
}
