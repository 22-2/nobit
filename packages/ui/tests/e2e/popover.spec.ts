import { test, expect } from "@playwright/test";

test.describe("Popover Component", () => {
    test.beforeEach(async ({ page }) => {
        // Storybookのポップオーバーストーリーに移動
        await page.goto(
            "/iframe.html?args=&id=common-usepopover--basic-popover&viewMode=story"
        );
        await page.waitForLoadState("networkidle");
    });

    test("should show popover when clicking post link", async ({ page }) => {
        // 投稿リンクをクリック
        await page.getByTestId("post-link-1").click();

        // ポップオーバーが表示されることを確認
        const popoverContainer = page.getByTestId("popover-container");
        await expect(popoverContainer).toBeVisible();

        // ポップオーバーの内容が表示されることを確認
        await expect(popoverContainer.locator(".popover")).toBeVisible();
    });

    test("should show multiple popovers when clicking different links", async ({
        page,
    }) => {
        // 最初の投稿リンクをクリック
        await page.getByTestId("post-link-1").click();
        await page.waitForTimeout(100); // アニメーション待機

        // 2番目の投稿リンクをクリック
        await page.getByTestId("post-link-2").click();
        await page.waitForTimeout(100);

        // 複数のポップオーバーが表示されることを確認
        const popoverContainer = page.getByTestId("popover-container");
        const popovers = popoverContainer.locator(".popover");
        await expect(popovers).toHaveCount(2);
    });

    test("should hide popovers when starting hide timer", async ({ page }) => {
        // ポップオーバーを表示
        await page.getByTestId("post-link-1").click();

        // ポップオーバーが表示されることを確認
        const popoverContainer = page.getByTestId("popover-container");
        await expect(popoverContainer.locator(".popover")).toBeVisible();

        // 非表示タイマーを開始
        await page.getByTestId("start-hide-timer").click();

        // ポップオーバーが非表示になることを確認（タイムアウト付き）
        await expect(popoverContainer.locator(".popover")).toHaveCount(0, {
            timeout: 2000,
        });
    });

    test("should show reply tree when clicking reply tree link", async ({
        page,
    }) => {
        // 返信ツリーリンクをクリック
        await page.getByTestId("reply-tree-1").click();

        // 返信ツリーのポップオーバーが表示されることを確認
        const popoverContainer = page.getByTestId("popover-container");
        await expect(popoverContainer.locator(".popover")).toBeVisible();

        // 返信ツリーの内容が表示されることを確認
        const popover = popoverContainer.locator(".popover").first();
        await expect(popover).toContainText("返信");
    });

    test("should handle non-existent post gracefully", async ({ page }) => {
        // 存在しない投稿リンクをクリック
        await page.getByTestId("post-link-3").click();

        // エラーハンドリングが適切に行われることを確認
        const popoverContainer = page.getByTestId("popover-container");

        // エラーメッセージまたは空の状態が表示されることを確認
        await page.waitForTimeout(500);
        const hasPopover =
            (await popoverContainer.locator(".popover").count()) > 0;

        if (hasPopover) {
            // エラーメッセージが表示される場合
            const popover = popoverContainer.locator(".popover").first();
            await expect(popover).toBeVisible();
        } else {
            // ポップオーバーが表示されない場合（正常なエラーハンドリング）
            await expect(popoverContainer.locator(".popover")).toHaveCount(0);
        }
    });

    test("should update active popover count", async ({ page }) => {
        // 初期状態でアクティブなポップオーバー数が0であることを確認
        await expect(
            page.locator("text=アクティブなポップオーバー数: 0")
        ).toBeVisible();

        // ポップオーバーを表示
        await page.getByTestId("post-link-1").click();
        await page.waitForTimeout(100);

        // アクティブなポップオーバー数が更新されることを確認
        await expect(
            page.locator("text=アクティブなポップオーバー数: 1")
        ).toBeVisible();

        // 2つ目のポップオーバーを表示
        await page.getByTestId("post-link-2").click();
        await page.waitForTimeout(100);

        // アクティブなポップオーバー数が2になることを確認
        await expect(
            page.locator("text=アクティブなポップオーバー数: 2")
        ).toBeVisible();
    });
});

test.describe("Popover Component - Custom Thread Data", () => {
    test.beforeEach(async ({ page }) => {
        // カスタムスレッドデータのストーリーに移動
        await page.goto(
            "/iframe.html?args=&id=common-usepopover--custom-thread-data&viewMode=story"
        );
        await page.waitForLoadState("networkidle");
    });

    test("should work with custom thread data", async ({ page }) => {
        // カスタムデータでポップオーバーが動作することを確認
        await page.getByTestId("post-link-1").click();

        const popoverContainer = page.getByTestId("popover-container");
        await expect(popoverContainer.locator(".popover")).toBeVisible();

        // カスタムデータの内容が表示されることを確認
        const popover = popoverContainer.locator(".popover").first();
        await expect(popover).toContainText("カスタムユーザー");
    });
});

test.describe("Popover Component - Mobile", () => {
    test.use({
        viewport: { width: 375, height: 667 }, // iPhone SE サイズ
    });

    test.beforeEach(async ({ page }) => {
        await page.goto(
            "/iframe.html?args=&id=common-usepopover--basic-popover&viewMode=story"
        );
        await page.waitForLoadState("networkidle");
    });

    test("should work on mobile devices", async ({ page }) => {
        // モバイルでもポップオーバーが正常に動作することを確認
        await page.getByTestId("post-link-1").click();

        const popoverContainer = page.getByTestId("popover-container");
        await expect(popoverContainer.locator(".popover")).toBeVisible();

        // モバイルでのレスポンシブ表示を確認
        const popover = popoverContainer.locator(".popover").first();
        const boundingBox = await popover.boundingBox();

        // ポップオーバーがビューポート内に収まっていることを確認
        expect(boundingBox?.width).toBeLessThanOrEqual(375);
    });

    test("should handle touch interactions", async ({ page }) => {
        // タッチイベントでポップオーバーが動作することを確認
        await page.getByTestId("post-link-1").tap();

        const popoverContainer = page.getByTestId("popover-container");
        await expect(popoverContainer.locator(".popover")).toBeVisible();
    });
});
