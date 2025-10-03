import type { App } from "obsidian";
import { writable, type Writable } from "svelte/store";
import { ObsidianFetcher } from "../lib/ObsidianFetcher";
import { DefaultDecoder } from "../lib/libch/decoder";
import { DefaultParser } from "../lib/libch/parser";
import type { Thread, ThreadFilters } from "../lib/types";

/**
 * ThreadManager manages thread-specific state and operations using existing 5ch infrastructure.
 * This class acts as a bridge between Obsidian's class-based world and Svelte's reactive UI world.
 * 
 * Key responsibilities:
 * - Manages reactive state using Svelte stores
 * - Encapsulates all 5ch API interactions using ObsidianFetcher, DefaultDecoder, and DefaultParser
 * - Provides clean interface for Svelte components
 * - Ensures no direct 'obsidian' imports in Svelte components
 * 
 * MVP Implementation Notes:
 * - Currently designed to work with hardcoded thread URLs for initial testing
 * - Uses bbs.eddibb.cc/livejupiter URLs consistent with existing libch test infrastructure
 * - Will be extended to support dynamic thread loading in future iterations
 */
export class ThreadManager {
	// Reactive state using Svelte stores
	thread: Writable<Thread | null> = writable(null);
	isLoading: Writable<boolean> = writable(false);
	error: Writable<string | null> = writable(null);
	filters: Writable<ThreadFilters> = writable({
		popular: false,
		image: false,
		video: false,
		external: false,
		internal: false,
		searchText: "",
	});

	// Private 5ch infrastructure components
	private fetcher: ObsidianFetcher;
	private decoder: DefaultDecoder;
	private parser: DefaultParser;

	constructor(private app: App) {
		// Initialize existing 5ch communication components
		this.fetcher = new ObsidianFetcher(300); // 300ms rate limiting
		this.decoder = new DefaultDecoder();
		this.parser = new DefaultParser();
	}

	/**
	 * Load a thread from the specified URL using existing 5ch infrastructure.
	 * Updates reactive state (thread, isLoading, error) that Svelte components can observe.
	 * 
	 * @param url - The 5ch thread URL to load
	 */
	async loadThread(url: string): Promise<void> {
		this.isLoading.set(true);
		this.error.set(null);

		try {
			// Use existing ObsidianFetcher with rate limiting
			const buffer = await this.fetcher.fetch(url);

			// Use existing decoder for Shift-JIS
			const datContent = this.decoder.decode(buffer);

			// Extract thread ID from URL for parsing
			const threadId = this.extractThreadIdFromUrl(url);

			// Use existing parser for 5ch DAT format
			const parsedThread = this.parser.parseThread(datContent, threadId, url);

			if (parsedThread) {
				this.thread.set(parsedThread);
			} else {
				throw new Error("Failed to parse thread data");
			}
		} catch (error: any) {
			this.thread.set(null); // Clear previous thread data on error
			this.error.set(`スレッドの読み込みに失敗しました: ${error.message}`);
		} finally {
			this.isLoading.set(false);
		}
	}

	/**
	 * Refresh the currently loaded thread by reloading from its URL.
	 */
	async refreshThread(): Promise<void> {
		const currentThread = await new Promise<Thread | null>(resolve => {
			const unsubscribe = this.thread.subscribe(value => {
				unsubscribe();
				resolve(value);
			});
		});
		
		if (currentThread?.url) {
			await this.loadThread(currentThread.url);
		}
	}

	/**
	 * Update thread filters state.
	 * Creates a new object to ensure Svelte reactivity.
	 * 
	 * @param newFilters - Partial filter updates to apply
	 */
	updateFilters(newFilters: Partial<ThreadFilters>): void {
		this.filters.update(current => ({ ...current, ...newFilters }));
	}

	/**
	 * Jump to a specific post number within the thread.
	 * This method can be extended to handle UI scrolling in the future.
	 * 
	 * @param resNumber - The post number to jump to
	 */
	jumpToPost(resNumber: number): void {
		// For now, this is a placeholder for future UI integration
		// The actual scrolling logic will be handled by Svelte components
		console.log(`Jumping to post ${resNumber}`);
	}

	/**
	 * Extract thread ID from a 5ch thread URL.
	 * 
	 * @param url - The thread URL
	 * @returns The extracted thread ID
	 */
	private extractThreadIdFromUrl(url: string): string {
		// Extract thread ID from URLs like:
		// https://example.5ch.net/test/read.cgi/board/1234567890/
		const match = url.match(/\/(\d{10})\/?$/);
		return match?.[1] || "unknown";
	}
}