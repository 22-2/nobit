import { expect, test } from "../base";
import { DIST_DIR, PLUGIN_ID } from "../constants";
import { MockDataFactory } from "../helpers/MockDataFactory";
import { TestFetcherMockHelper } from "../helpers/TestFetcherMockHelper";
import { ThreadViewPageObject } from "../helpers/ThreadViewPageObject";
import "../setup/logger-setup";

test.describe("ポップアップの挙動テスト", () => {
	test("アンカーリンクからポップアップにカーソルを移動できる", async ({
		vault,
	}) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// モックデータをセットアップ
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		// スレッドビューを開く
		await threadPage.openPluginWithURL(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);

		// スレッドが読み込まれるまで待機
		await vault.window.waitForSelector(".post", { timeout: 10000 });

		// アンカーリンクにホバー
		const anchorLink = vault.window.locator(".internal-res-link").first();
		await anchorLink.hover();
		await vault.window.waitForTimeout(150);

		// ポップアップが表示されることを確認
		const popover = vault.window.locator(".popover.hover-popover").first();
		await expect(popover).toBeVisible();

		// ポップアップにカーソルを移動
		await popover.hover();
		await vault.window.waitForTimeout(400); // タイマーより長く待つ

		// ポップアップがまだ表示されていることを確認
		await expect(popover).toBeVisible();
	});

	test("親ポップアップをクリックしたら子ポップアップが閉じる", async ({
		vault,
	}) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// モックデータをセットアップ
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		// スレッドビューを開く
		await threadPage.openPluginWithURL(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);

		// スレッドが読み込まれるまで待機
		await vault.window.waitForSelector(".post", { timeout: 10000 });

		// 最初のアンカーリンク（>>2など）を探す
		const firstAnchorLink = await vault.window
			.locator(".internal-res-link")
			.first();
		await expect(firstAnchorLink).toBeVisible();

		// 最初のアンカーリンクにホバーして親ポップアップを表示
		await firstAnchorLink.hover();
		await vault.window.waitForTimeout(100);

		// 親ポップアップが表示されることを確認
		const parentPopover = vault.window
			.locator(".popover.hover-popover")
			.first();
		await expect(parentPopover).toBeVisible();

		// 親ポップアップ内のアンカーリンクを探す
		const childAnchorLink = parentPopover.locator(".internal-res-link").first();

		// 子アンカーリンクが存在する場合のみテストを続行
		if ((await childAnchorLink.count()) > 0) {
			// 子アンカーリンクにホバーして子ポップアップを表示
			await childAnchorLink.hover();
			await vault.window.waitForTimeout(100);

			// 子ポップアップが表示されることを確認
			const allPopovers = vault.window.locator(".popover.hover-popover");
			await expect(allPopovers).toHaveCount(2);

			// 親ポップアップをクリック
			await parentPopover.click();
			await vault.window.waitForTimeout(100);

			// 子ポップアップが閉じられることを確認（親ポップアップは残る）
			await expect(allPopovers).toHaveCount(1);
			await expect(parentPopover).toBeVisible();
		}
	});

	test("親ポップアップの外側をクリックしたら全てのポップアップが閉じる", async ({
		vault,
	}) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// モックデータをセットアップ
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		// スレッドビューを開く
		await threadPage.openPluginWithURL(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);

		// スレッドが読み込まれるまで待機
		await vault.window.waitForSelector(".post", { timeout: 10000 });

		// アンカーリンクにホバーしてポップアップを表示
		const anchorLink = await vault.window.locator(".internal-res-link").first();
		await anchorLink.hover();
		await vault.window.waitForTimeout(100);

		// ポップアップが表示されることを確認
		const popover = vault.window.locator(".popover.hover-popover").first();
		await expect(popover).toBeVisible();

		// ポップアップの外側（スレッドビューの本文エリア）をクリック
		const threadView = vault.window.locator(".thread-view");
		await threadView.click({ position: { x: 10, y: 10 } });
		await vault.window.waitForTimeout(100);

		// 全てのポップアップが閉じられることを確認
		await expect(popover).not.toBeVisible();
	});

	test("返信ツリーリンクが存在することを確認", async ({ vault }) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// モックデータをセットアップ
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		// スレッドビューを開く
		await threadPage.openPluginWithURL(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);

		// スレッドが読み込まれるまで待機
		await vault.window.waitForSelector(".post", { timeout: 10000 });

		// 全ての投稿を確認
		const posts = vault.window.locator(".post");
		const postCount = await posts.count();
		console.log(`投稿数: ${postCount}`);

		// 各投稿の内容を確認
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

		// 返信ツリーリンクを探す
		const replyTreeLinks = vault.window.locator(".reply-tree-link");
		const replyTreeLinkCount = await replyTreeLinks.count();
		console.log(`全体の返信ツリーリンク数: ${replyTreeLinkCount}`);

		// 少なくとも1つは返信ツリーリンクがあるはず（投稿3が投稿1と2を参照している）
		expect(replyTreeLinkCount).toBeGreaterThan(0);
	});

	test("返信ツリーポップアップが正しく表示される", async ({ vault }) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// モックデータをセットアップ
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		// スレッドビューを開く
		await threadPage.openPluginWithURL(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);

		// スレッドが読み込まれるまで待機
		await vault.window.waitForSelector(".post", { timeout: 10000 });

		// 返信ツリーリンクを探す
		const replyTreeLink = vault.window.locator(".reply-tree-link").first();
		const linkCount = await replyTreeLink.count();
		console.log(`返信ツリーリンク数: ${linkCount}`);

		if (linkCount > 0) {
			// 返信ツリーリンクをクリック
			await replyTreeLink.click();
			await vault.window.waitForTimeout(300);

			// ポップアップが表示されることを確認
			const popover = vault.window.locator(".popover.hover-popover").first();
			await expect(popover).toBeVisible({ timeout: 5000 });

			// ポップアップ内のコンテンツを確認
			const popoverContent = await popover.textContent();
			console.log(
				`ポップアップの内容: ${popoverContent?.substring(0, 100)}...`,
			);

			// ポップアップ内のアンカーリンクを確認
			const anchorLinks = popover.locator(".internal-res-link");
			const anchorLinkCount = await anchorLinks.count();
			console.log(`ポップアップ内のアンカーリンク数: ${anchorLinkCount}`);
		} else {
			console.log("返信ツリーリンクが見つかりませんでした");
		}
	});

	test("返信ツリーポップアップ内のアンカーリンクから子ポップアップを開いて親をクリックすると子が閉じる", async ({
		vault,
	}) => {
		const threadPage = new ThreadViewPageObject(
			vault.window,
			vault.pluginHandleMap,
		);
		const mockHelper = new TestFetcherMockHelper(vault.window);

		// モックデータをセットアップ
		await mockHelper.setupPatternMock(".dat", {
			status: 200,
			body: MockDataFactory.createBasicThreadData(),
		});

		// スレッドビューを開く
		await threadPage.openPluginWithURL(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);

		// スレッドが読み込まれるまで待機
		await vault.window.waitForSelector(".post", { timeout: 10000 });

		// 返信ツリーリンクを探す
		const replyTreeLink = vault.window.locator(".reply-tree-link").first();
		const linkCount = await replyTreeLink.count();

		if (linkCount === 0) {
			console.log("返信ツリーリンクが見つからないためテストをスキップ");
			return;
		}

		// 返信ツリーリンクをクリックして親ポップアップを表示
		await replyTreeLink.click();
		await vault.window.waitForTimeout(300);

		// 親ポップアップ（返信ツリー）が表示されることを確認
		const parentPopover = vault.window
			.locator(".popover.hover-popover")
			.first();
		await expect(parentPopover).toBeVisible({ timeout: 5000 });

		// 親ポップアップ内のアンカーリンクを探す
		const childAnchorLink = parentPopover.locator(".internal-res-link").first();
		const childLinkCount = await childAnchorLink.count();
		console.log(`親ポップアップ内のアンカーリンク数: ${childLinkCount}`);

		if (childLinkCount === 0) {
			console.log(
				"親ポップアップ内にアンカーリンクが見つからないためテストをスキップ",
			);
			return;
		}

		// 子アンカーリンクにホバーして子ポップアップを表示
		await childAnchorLink.hover();
		await vault.window.waitForTimeout(200);

		// 子ポップアップが表示されることを確認
		const allPopovers = vault.window.locator(".popover.hover-popover");
		const popoverCount = await allPopovers.count();
		console.log(`ポップアップ数（子表示後）: ${popoverCount}`);
		await expect(allPopovers).toHaveCount(2);

		// 親ポップアップ内のPostItemの本文部分をクリック
		console.log("親ポップアップ内のPostItemをクリック");
		const parentPostContent = parentPopover.locator(".post-content").first();
		await expect(parentPostContent).toBeVisible();
		await parentPostContent.click();
		await vault.window.waitForTimeout(200);

		// 子ポップアップが閉じられることを確認（親ポップアップは残る）
		const popoverCountAfterClick = await allPopovers.count();
		console.log(`ポップアップ数（親クリック後）: ${popoverCountAfterClick}`);
		await expect(allPopovers).toHaveCount(1);
		await expect(parentPopover).toBeVisible();
	});
});

// カスタム設定
test.use({
	vaultOptions: {
		useSandbox: true,
		showLoggerOnNode: true,
		plugins: [
			{
				path: DIST_DIR,
				pluginId: PLUGIN_ID,
			},
		],
	},
});
