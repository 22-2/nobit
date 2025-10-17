import { expect, test } from "../base";
import { BaseTestSetup, DEFAULT_TEST_CONFIG } from "../helpers/BaseTestSetup";
import { MockDataFactory } from "../helpers/MockDataFactory";
import "../setup/logger-setup";

/**
 * Test for filtering + reply popup bug
 * Bug: When filtering is applied, reply popups show wrong posts
 * because filtered array index was used instead of actual post number
 */
test.describe("フィルタリング時の返信ポップアップ", () => {
	test("フィルタリング時に返信ポップアップが正しいレスを表示する", async ({
		vault,
	}) => {
		const setup = new BaseTestSetup(vault);

		// Create mock data with more posts and anchors
		const mockData = MockDataFactory.createLargeThreadData(50);
		await setup.getMockHelper().setupPatternMock(".dat", {
			status: 200,
			body: mockData,
		});

		// Setup thread with unique URL to avoid cache issues
		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970001/",
		);
		await vault.window.waitForSelector(".post", { timeout: 10000 });

		// Get initial post count
		const initialPostCount = await vault.window.locator(".post").count();
		console.log(`初期投稿数: ${initialPostCount}`);
		expect(initialPostCount).toBeGreaterThan(5); // Need enough posts to test filtering

		// Find posts with replies (anchors pointing to them)
		// In createLargeThreadData, post i % 25 === 0 has anchors to i-5 and i-10
		// So posts 20, 15, 45, 40, etc. should have replies
		const postsWithReplies = await vault.window.evaluate(() => {
			const posts = Array.from(document.querySelectorAll(".post"));
			const postsData = posts.map((el, idx) => {
				const replyLink = el.querySelector(".reply-tree-link");
				const resNumber = el.getAttribute("data-res-number");
				return {
					index: idx,
					resNumber: resNumber ? parseInt(resNumber) : 0,
					hasReplies: !!replyLink,
					replyLinkText: replyLink?.textContent || "",
				};
			});
			return postsData.filter((p) => p.hasReplies);
		});

		console.log(`返信があるレス数: ${postsWithReplies.length}`);
		if (postsWithReplies.length === 0) {
			console.log("返信があるレスが見つからないためスキップ");
			test.skip();
			return;
		}

		// Pick a post in the middle with replies (e.g., post 20 or 15)
		const targetPost =
			postsWithReplies.find((p) => p.resNumber >= 15) ||
			postsWithReplies[0];
		console.log(
			`テスト対象レス: #${targetPost.resNumber} (${targetPost.replyLinkText})`,
		);

		// Apply filter to show only posts 20-29 by searching for "投稿番号2"
		// This will filter out posts 1-19 and 30+, but keep post 20-29
		const searchInput = vault.window.locator(
			'.thread-filters input[type="text"]',
		);
		await searchInput.fill("投稿番号2");
		await vault.window.waitForTimeout(500); // Wait for filter to apply

		// Get filtered post count
		const filteredPostCount = await vault.window.locator(".post").count();
		console.log(
			`フィルタリング後の投稿数: ${filteredPostCount} (初期: ${initialPostCount})`,
		);

		// Verify filtering worked - should show posts 20-29 (10 posts)
		expect(filteredPostCount).toBeLessThan(initialPostCount);
		expect(filteredPostCount).toBeGreaterThan(0);

		// Find the reply tree link in the filtered view
		const replyTreeLinks = vault.window.locator(".reply-tree-link");
		const replyLinkCount = await replyTreeLinks.count();

		if (replyLinkCount === 0) {
			console.log(
				"フィルタリング後に返信リンクが見つからないためスキップ",
			);
			test.skip();
			return;
		}

		// Click the first reply tree link
		const firstReplyLink = replyTreeLinks.first();
		const linkedResNumber =
			await firstReplyLink.getAttribute("data-res-number");
		console.log(`返信リンクのレス番号: ${linkedResNumber}`);

		await firstReplyLink.click({ force: true });
		await vault.window.waitForTimeout(300);

		// Verify popover appeared
		const popover = vault.window.locator(".popover.hover-popover");
		await expect(popover).toBeVisible({ timeout: 2000 });

		// Get the post content in the popover
		const popoverPost = popover.locator(".post").first();
		const popoverResNumber =
			await popoverPost.getAttribute("data-res-number");

		console.log(
			`ポップアップ内のレス番号: ${popoverResNumber}, 期待値: ${linkedResNumber}`,
		);

		// CRITICAL: The popover should show the post tree for the ORIGINAL post number,
		// not the filtered array index
		expect(popoverResNumber).toBe(linkedResNumber);

		// Additional verification: Check if the popover shows replies
		const repliesInPopover = await popover
			.locator(".post-tree-replies .post")
			.count();
		console.log(`ポップアップ内の返信数: ${repliesInPopover}`);

		// Should have at least the origin post
		expect(repliesInPopover).toBeGreaterThan(0);

		console.log("✓ フィルタリング時に返信ポップアップが正しく表示された");
	});

	test.skip("フィルタリング時のアンカーポップアップが正しいレスを表示する", async ({
		vault,
	}) => {
		const setup = new BaseTestSetup(vault);

		// Create mock data with more posts and anchors
		const mockData = MockDataFactory.createLargeThreadData(50);
		await setup.getMockHelper().setupPatternMock(".dat", {
			status: 200,
			body: mockData,
		});

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970002/",
		);
		await vault.window.waitForSelector(".post", { timeout: 10000 });

		// Get a post with anchor links
		// In createLargeThreadData, post 25 and 50 have anchors
		const postWithAnchors = await vault.window.evaluate(() => {
			const posts = Array.from(document.querySelectorAll(".post"));
			for (const post of posts) {
				const anchorLink = post.querySelector(".internal-res-link");
				if (anchorLink) {
					const resNumber = post.getAttribute("data-res-number");
					const targetResNumber =
						anchorLink.getAttribute("data-res-number");
					return {
						resNumber: resNumber ? parseInt(resNumber) : 0,
						targetResNumber: targetResNumber
							? parseInt(targetResNumber)
							: 0,
					};
				}
			}
			return null;
		});

		if (!postWithAnchors) {
			console.log("アンカーリンクを持つレスが見つからないためスキップ");
			test.skip();
			return;
		}

		console.log(`テスト対象レス: #${postWithAnchors.resNumber}`);
		console.log(`アンカー先: #${postWithAnchors.targetResNumber}`);

		// Apply filter to show posts 20-29
		const searchInput = vault.window.locator(
			'.thread-filters input[type="text"]',
		);
		await searchInput.fill("投稿番号2");
		await vault.window.waitForTimeout(500);

		// Hover over anchor link
		const anchorLink = vault.window.locator(".internal-res-link").first();
		const anchorTargetResNumber =
			await anchorLink.getAttribute("data-res-number");

		await anchorLink.hover();
		await vault.window.waitForTimeout(300);

		// Verify popover shows correct post
		const popover = vault.window.locator(".popover.hover-popover");
		await expect(popover).toBeVisible({ timeout: 2000 });

		const popoverPost = popover.locator(".post").first();
		const popoverResNumber =
			await popoverPost.getAttribute("data-res-number");

		console.log(
			`ポップアップ内のレス番号: ${popoverResNumber}, 期待値: ${anchorTargetResNumber}`,
		);

		expect(popoverResNumber).toBe(anchorTargetResNumber);

		console.log(
			"✓ フィルタリング時にアンカーポップアップが正しく表示された",
		);
	});
});

test.use(DEFAULT_TEST_CONFIG);
