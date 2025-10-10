import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { ThreadViewPageObject } from "./ThreadViewPageObject";

/**
 * Helper class for title-related test operations
 * Following Single Responsibility Principle
 */
export class TitleTestHelper {
	constructor(
		private window: Page,
		private threadPage: ThreadViewPageObject,
	) {}

	/**
	 * Verify title consistency across all sources
	 */
	async verifyTitleConsistency(expectedTitle: string): Promise<void> {
		const consistency = await this.threadPage.verifyTitleConsistency();

		expect(consistency.titleBar).toBeTruthy();
		expect(consistency.allMatch).toBe(true);
		expect(consistency.titleBar).toContain(expectedTitle);

		console.log("✓ All title sources are synchronized:", consistency.titleBar);
	}

	/**
	 * Verify title in tab header
	 */
	async verifyTabHeaderTitle(expectedTitle: string): Promise<void> {
		const tabHeaderText = await this.threadPage.getTabHeaderText();
		expect(tabHeaderText).toBeTruthy();
		expect(tabHeaderText).toContain(expectedTitle);
		console.log("✓ Tab header displays thread title:", tabHeaderText);
	}

	/**
	 * Verify title in thread header
	 */
	async verifyThreadHeaderTitle(expectedTitle: string): Promise<void> {
		const headerTitle = await this.threadPage.getThreadHeaderTitle();
		expect(headerTitle).toBeTruthy();
		expect(headerTitle).toContain(expectedTitle);
		console.log("✓ Thread header displays title:", headerTitle);
	}

	/**
	 * Verify title in ThreadManager state
	 */
	async verifyThreadManagerTitle(expectedTitle: string): Promise<void> {
		const state = await this.threadPage.getThreadManagerState();
		expect(state?.threadTitle).toBeTruthy();
		expect(state?.threadTitle).toContain(expectedTitle);
		console.log("✓ ThreadManager state has correct title:", state?.threadTitle);
	}

	/**
	 * Verify all title locations at once
	 */
	async verifyAllTitles(expectedTitle: string): Promise<void> {
		await this.verifyTabHeaderTitle(expectedTitle);
		await this.verifyThreadHeaderTitle(expectedTitle);
		await this.verifyThreadManagerTitle(expectedTitle);
		await this.verifyTitleConsistency(expectedTitle);
	}

	/**
	 * Navigate to new URL via title bar
	 */
	async navigateViaTitle(newUrl: string): Promise<void> {
		const titleEl = this.window.locator(
			".workspace-leaf.mod-active .view-header-title",
		);
		await expect(titleEl).toBeVisible();
		await titleEl.click();
		await this.window.waitForTimeout(100);

		await titleEl.fill(newUrl);
		await titleEl.press("Enter");
		await this.window.waitForTimeout(500);

		await this.threadPage.waitForThreadContent(10000);
	}

	/**
	 * Test title restoration on blur
	 */
	async testTitleRestoration(expectedTitle: string): Promise<void> {
		const titleEl = this.window.locator(
			".workspace-leaf.mod-active .view-header-title",
		);
		const originalTitle = await titleEl.textContent();

		await titleEl.click();
		await this.window.waitForTimeout(100);
		await titleEl.fill("Some random text");

		await this.window.locator("body").click();
		await this.window.waitForTimeout(300);

		const restoredTitle = await titleEl.textContent();
		expect(restoredTitle).toBe(expectedTitle);
		console.log("✓ Title restored on blur without Enter");
	}
}
