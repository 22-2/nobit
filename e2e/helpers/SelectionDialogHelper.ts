import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { PLUGIN_ID } from "../constants";
import { ThreadViewPageObject } from "./ThreadViewPageObject";

/**
 * Helper class for selection dialog test operations
 * Following Single Responsibility Principle
 */
export class SelectionDialogHelper {
	constructor(
		private window: Page,
		private threadPage: ThreadViewPageObject,
	) {}

	/**
	 * Add entry to URL history
	 */
	async addToHistory(url: string, title: string): Promise<void> {
		await this.window.evaluate(
			async (args) => {
				const plugin = (window as any).app.plugins.plugins[args.pluginId];
				await plugin.addToUrlHistory(args.url, args.title);
			},
			{ pluginId: PLUGIN_ID, url, title },
		);

		await this.window.waitForTimeout(300);
	}

	/**
	 * Open selection dialog
	 */
	async openDialog(): Promise<void> {
		await this.threadPage.runCommand(`${PLUGIN_ID}:open-with-url`);

		await this.window.waitForFunction(
			() => {
				const prompt = document.querySelector(".prompt");
				return prompt !== null;
			},
			{ timeout: 3000 },
		);
	}

	/**
	 * Select first item with Enter key
	 */
	async selectFirstItemWithEnter(): Promise<void> {
		await this.window.keyboard.press("Enter");
	}

	/**
	 * Click on first suggestion
	 */
	async clickFirstSuggestion(): Promise<boolean> {
		return await this.window.evaluate(() => {
			const suggestion = document.querySelector(".suggestion-item");
			if (suggestion) {
				(suggestion as HTMLElement).click();
				return true;
			}
			return false;
		});
	}

	/**
	 * Test selection with Enter key
	 */
	async testSelectionWithEnter(
		url: string,
		title: string,
		expectedTitle: string,
	): Promise<void> {
		await this.addToHistory(url, title);
		await this.openDialog();
		await this.selectFirstItemWithEnter();

		await this.threadPage.waitForView("thread-view");
		await this.threadPage.waitForThreadContent();

		const threadTitle = await this.threadPage.getThreadHeaderTitle();
		expect(threadTitle).toBe(expectedTitle);

		console.log("✓ Thread opened via Enter key selection");
	}

	/**
	 * Test selection with mouse click
	 */
	async testSelectionWithClick(
		url: string,
		title: string,
		expectedTitle: string,
	): Promise<void> {
		await this.addToHistory(url, title);
		await this.openDialog();

		const clicked = await this.clickFirstSuggestion();
		expect(clicked).toBe(true);

		await this.threadPage.waitForView("thread-view");
		await this.threadPage.waitForThreadContent();

		const threadTitle = await this.threadPage.getThreadHeaderTitle();
		expect(threadTitle).toBe(expectedTitle);

		console.log("✓ Thread opened via mouse click selection");
	}
}
