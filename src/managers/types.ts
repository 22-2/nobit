import type { App, Menu } from "obsidian";
import type { BBSProvider } from "src/lib/libch/provider";

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
	 * BBS provider for fetching thread data from 5ch-compatible boards.
	 */
	provider: BBSProvider;
	/**
	 * Factory function to create Obsidian Menu instances.
	 */
	createMenu: () => Menu;
	/**
	 * Function to set tooltip on an HTML element.
	 */
	setTooltip: (element: HTMLElement, tooltip: string) => void;
}

/**
 * Context interface for ThreadManager.
 * Extends BaseManagerContext with thread-specific dependencies.
 * Each dependency is minimal and easily mockable for testing.
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
 * Each dependency is minimal and easily mockable for testing.
 */
export interface BoardManagerContext extends BaseManagerContext {
	/**
	 * Callback to show a notice message to the user.
	 */
	showNotice: (message: string) => void;

	/**
	 * Callback to open a new view with the given URL.
	 */
	openWithURL: (url: string) => Promise<void>;
}
