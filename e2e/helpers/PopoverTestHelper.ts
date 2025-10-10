import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Helper class for popover-related test operations
 * Following Single Responsibility Principle
 */
export class PopoverTestHelper {
	constructor(private window: Page) {}

	/**
	 * Get first popover element
	 */
	getFirstPopover(): Locator {
		return this.window.locator(".popover.hover-popover").first();
	}

	/**
	 * Get all popover elements
	 */
	getAllPopovers(): Locator {
		return this.window.locator(".popover.hover-popover");
	}

	/**
	 * Hover on anchor link and verify popover appears
	 */
	async hoverAndVerifyPopover(anchorLink: Locator): Promise<Locator> {
		await anchorLink.hover();
		await this.window.waitForTimeout(150);

		const popover = this.getFirstPopover();
		await expect(popover).toBeVisible();

		return popover;
	}

	/**
	 * Test popover persistence when hovering over it
	 */
	async testPopoverPersistence(anchorLink: Locator): Promise<void> {
		const popover = await this.hoverAndVerifyPopover(anchorLink);

		await popover.hover();
		await this.window.waitForTimeout(400);

		await expect(popover).toBeVisible();
		console.log("✓ Popover persists when hovering over it");
	}

	/**
	 * Test parent-child popover interaction
	 */
	async testParentChildPopover(
		parentAnchorLink: Locator,
	): Promise<{ parent: Locator; child: Locator | null }> {
		const parentPopover = await this.hoverAndVerifyPopover(parentAnchorLink);

		const childAnchorLink = parentPopover.locator(".internal-res-link").first();
		const childLinkCount = await childAnchorLink.count();

		if (childLinkCount === 0) {
			console.log("No child anchor link found in parent popover");
			return { parent: parentPopover, child: null };
		}

		await childAnchorLink.hover();
		await this.window.waitForTimeout(200);

		const allPopovers = this.getAllPopovers();
		await expect(allPopovers).toHaveCount(2);

		return { parent: parentPopover, child: allPopovers.nth(1) };
	}

	/**
	 * Test clicking parent closes child popover
	 */
	async testParentClickClosesChild(parentAnchorLink: Locator): Promise<void> {
		const { parent, child } =
			await this.testParentChildPopover(parentAnchorLink);

		if (!child) {
			console.log("Skipping test - no child popover");
			return;
		}

		const parentPostContent = parent.locator(".post-content").first();
		await expect(parentPostContent).toBeVisible();
		await parentPostContent.click();
		await this.window.waitForTimeout(200);

		const allPopovers = this.getAllPopovers();
		await expect(allPopovers).toHaveCount(1);
		await expect(parent).toBeVisible();

		console.log("✓ Child popover closed when parent clicked");
	}

	/**
	 * Test clicking outside closes all popovers
	 */
	async testClickOutsideClosesAll(anchorLink: Locator): Promise<void> {
		const popover = await this.hoverAndVerifyPopover(anchorLink);

		const threadView = this.window.locator(".thread-view");
		await threadView.click({ position: { x: 10, y: 10 } });
		await this.window.waitForTimeout(100);

		await expect(popover).not.toBeVisible();
		console.log("✓ All popovers closed when clicking outside");
	}

	/**
	 * Test reply tree link popover
	 */
	async testReplyTreePopover(): Promise<void> {
		const replyTreeLink = this.window.locator(".reply-tree-link").first();
		const linkCount = await replyTreeLink.count();

		if (linkCount === 0) {
			console.log("No reply tree link found");
			return;
		}

		await replyTreeLink.click();
		await this.window.waitForTimeout(300);

		const popover = this.getFirstPopover();
		await expect(popover).toBeVisible({ timeout: 5000 });

		const popoverContent = await popover.textContent();
		console.log(`Popover content: ${popoverContent?.substring(0, 100)}...`);

		const anchorLinks = popover.locator(".internal-res-link");
		const anchorLinkCount = await anchorLinks.count();
		console.log(`Anchor links in popover: ${anchorLinkCount}`);
	}
}
