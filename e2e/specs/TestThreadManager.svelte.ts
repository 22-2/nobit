// E:\Desktop\coding\my-projects-02\nobit\src\managers\__tests__\TestThreadManager.ts
import type { App } from "obsidian";
import type { Thread } from "../lib/types";
import type { BaseManagerOptions } from "./BaseManager";
import { ThreadManager } from "./ThreadManager.svelte";
import { ThreadManagerTestHelper } from "./ThreadManagerTestHelper";

/**
 * TestThreadManager extends ThreadManager to add test-specific functionality
 * This class should ONLY be used in test environments
 *
 * Usage:
 * ```typescript
 * // In test files only
 * const testManager = new TestThreadManager(app);
 * await testManager.loadThread(TEST_URL);
 * ```
 */
export class TestThreadManager extends ThreadManager {
	constructor(app: App, options: BaseManagerOptions = {}) {
		super(app, options);
	}

	/**
	 * Override loadThread to use test fixtures when appropriate
	 */
	async loadThread(url: string): Promise<void> {
		// Check if we should use test fixture
		if (ThreadManagerTestHelper.shouldUseTestFixture(url)) {
			await this.loadTestFixture(url);
			return;
		}

		// Otherwise use normal loading
		await super.loadThread(url);
	}

	/**
	 * Load test fixture data
	 */
	private async loadTestFixture(url: string): Promise<void> {
		this.isLoading = true;
		this.error = null;

		console.log(
			`🔥 TestThreadManager: Loading test fixture for URL: ${url}`
		);

		try {
			const mockData = await ThreadManagerTestHelper.loadTestFixture(url);
			const threadId = this.extractThreadIdFromUrl(url);
			const parsedThread = this.parseThreadForTest(
				mockData,
				threadId,
				url
			);

			if (!parsedThread) {
				throw new Error("Failed to parse test fixture data");
			}

			this.thread = parsedThread;
			console.log(
				`🔥 TestThreadManager: Successfully loaded test thread: ${parsedThread.title} (${parsedThread.posts.length} posts)`
			);
		} catch (error) {
			console.error(
				`🔥 TestThreadManager: Error loading test fixture:`,
				error
			);
			this.handleThreadLoadError(error);
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Parse thread data for testing (exposes private method)
	 */
	private parseThreadForTest(
		datContent: string,
		threadId: string,
		url: string
	): Thread | null {
		// Access parent's private method through reflection
		// This is only acceptable in test code
		return (this as any).parseThreadWithFallback(datContent, threadId, url);
	}

	/**
	 * Extract thread ID (exposes private method for testing)
	 */
	private extractThreadIdFromUrl(url: string): string {
		return (this as any).extractThreadIdFromUrl(url);
	}

	/**
	 * Handle error (exposes private method for testing)
	 */
	private handleThreadLoadError(error: unknown): void {
		(this as any).handleThreadLoadError(error);
	}
}

/**
 * Factory function to create appropriate manager based on environment
 */
export function createThreadManager(
	app: App,
	options: BaseManagerOptions = {}
): ThreadManager {
	if (ThreadManagerTestHelper.isTestEnvironment()) {
		return new TestThreadManager(app, options);
	}
	return new ThreadManager(app, options);
}
