import { expect, test } from "../base";
import { BaseTestSetup, DEFAULT_TEST_CONFIG } from "../helpers/BaseTestSetup";
import { PopoverTestHelper } from "../helpers/PopoverTestHelper";
import "../setup/logger-setup";

/**
 * Popover Behavior Tests
 * Refactored following SOLID principles
 */
test.describe("ポップアップの挙動テスト", () => {
	test("アンカーリンクからポップアップにカーソルを移動できる", async ({
		vault,
	}) => {
		const setup = new BaseTestSetup(vault);
		const popoverHelper = new PopoverTestHelper(vault.window);

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);
		await vault.window.waitForSelector(".post", { timeout: 10000 });

		const anchorLink = vault.window.locator(".internal-res-link").first();
		await popoverHelper.testPopoverPersistence(anchorLink);
	});

	test("親ポップアップをクリックしたら子ポップアップが閉じる", async ({
		vault,
	}) => {
		const setup = new BaseTestSetup(vault);
		const popoverHelper = new PopoverTestHelper(vault.window);

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);
		await vault.window.waitForSelector(".post", { timeout: 10000 });

		const firstAnchorLink = vault.window.locator(".internal-res-link").first();
		await popoverHelper.testParentClickClosesChild(firstAnchorLink);
	});

	test("親ポップアップの外側をクリックしたら全てのポップアップが閉じる", async ({
		vault,
	}) => {
		const setup = new BaseTestSetup(vault);
		const popoverHelper = new PopoverTestHelper(vault.window);

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);
		await vault.window.waitForSelector(".post", { timeout: 10000 });

		const anchorLink = vault.window.locator(".internal-res-link").first();
		await popoverHelper.testClickOutsideClosesAll(anchorLink);
	});

	test("返信ツリーリンクが存在することを確認", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);
		await vault.window.waitForSelector(".post", { timeout: 10000 });

		const posts = vault.window.locator(".post");
		const postCount = await posts.count();
		console.log(`投稿数: ${postCount}`);

		for (let i = 0; i < postCount; i++) {
			const post = posts.nth(i);
			const postNumber = await post.getAttribute("data-res-number");
			const replyLinks = post.locator(".reply-tree-link");
			const replyLinkCount = await replyLinks.count();
			console.log(`投稿 ${postNumber}: 返信リンク数 = ${replyLinkCount}`);

			if (replyLinkCount > 0) {
				const linkText = await replyLinks.first().textContent();
				console.log(`  返信リンクテキスト: ${linkText}`);
			}
		}

		const replyTreeLinks = vault.window.locator(".reply-tree-link");
		const replyTreeLinkCount = await replyTreeLinks.count();
		console.log(`全体の返信ツリーリンク数: ${replyTreeLinkCount}`);

		expect(replyTreeLinkCount).toBeGreaterThan(0);
	});

	test("返信ツリーポップアップが正しく表示される", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);
		const popoverHelper = new PopoverTestHelper(vault.window);

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);
		await vault.window.waitForSelector(".post", { timeout: 10000 });

		await popoverHelper.testReplyTreePopover();
	});

	test("返信ツリーポップアップ内のアンカーリンクから子ポップアップを開いて親をクリックすると子が閉じる", async ({
		vault,
	}) => {
		const setup = new BaseTestSetup(vault);
		const popoverHelper = new PopoverTestHelper(vault.window);

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);
		await vault.window.waitForSelector(".post", { timeout: 10000 });

		const replyTreeLink = vault.window.locator(".reply-tree-link").first();
		await popoverHelper.testParentClickClosesChild(replyTreeLink);
	});
});

test.use(DEFAULT_TEST_CONFIG);
