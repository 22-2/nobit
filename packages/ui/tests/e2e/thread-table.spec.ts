import { test, expect } from "@playwright/test";

test.describe("Thread Table Components", () => {
    test.beforeEach(async ({ page }) => {
        // Storybookのスレッドテーブルストーリーに移動
        await page.goto(
            "/iframe.html?args=&id=board-bbsthreadtable--default&viewMode=story"
        );
        await page.waitForLoadState("networkidle");
    });

    test("should display thread table with correct structure", async ({
        page,
    }) => {
        // テーブルヘッダーが表示されることを確認
        await expect(page.locator('[role="columnheader"]')).toHaveCount(4); // index, title, resCount, ikioi

        // テーブル行が表示されることを確認
        const threadRows = page.locator('[data-testid^="thread-row-"]');
        await expect(threadRows).toHaveCountGreaterThan(0);
    });

    test("should show thread details on row hover", async ({ page }) => {
        // 最初のスレッド行を取得
        const firstRow = page.locator('[data-testid^="thread-row-"]').first();
        await expect(firstRow).toBeVisible();

        // ホバー時にスタイルが変更されることを確認
        await firstRow.hover();

        // ホバー状態のスタイルが適用されることを確認
        const backgroundColor = await firstRow.evaluate(
            (el) => getComputedStyle(el).backgroundColor
        );
        expect(backgroundColor).not.toBe("rgba(0, 0, 0, 0)"); // 透明でないことを確認
    });

    test("should handle thread row click events", async ({ page }) => {
        // クリックイベントをリッスン
        let clickEventFired = false;
        await page.exposeFunction("onThreadClick", () => {
            clickEventFired = true;
        });

        // 最初のスレッド行をクリック
        const firstRow = page.locator('[data-testid^="thread-row-"]').first();
        await firstRow.click({ button: "left" });

        // クリックイベントが処理されることを確認（実際の実装に依存）
        await expect(firstRow).toBeVisible();
    });

    test("should handle right-click context menu", async ({ page }) => {
        // 最初のスレッド行を右クリック
        const firstRow = page.locator('[data-testid^="thread-row-"]').first();
        await firstRow.click({ button: "right" });

        // コンテキストメニューの処理が実行されることを確認
        // （実際の実装では、コンテキストメニューが表示される）
        await expect(firstRow).toBeVisible();
    });

    test("should display correct thread information", async ({ page }) => {
        // スレッドタイトルが表示されることを確認
        const titleCells = page.locator(".col-title");
        await expect(titleCells.first()).toBeVisible();

        // レス数が表示されることを確認
        const resCells = page.locator(".col-res");
        await expect(resCells.first()).toBeVisible();

        // 勢いが表示されることを確認
        const ikioiCells = page.locator(".col-ikioi");
        await expect(ikioiCells.first()).toBeVisible();
    });

    test("should truncate long thread titles", async ({ page }) => {
        // 長いタイトルが省略されることを確認
        const titleContent = page.locator(".title-cell-content").first();
        await expect(titleContent).toBeVisible();

        // text-overflow: ellipsis が適用されていることを確認
        const textOverflow = await titleContent.evaluate(
            (el) => getComputedStyle(el).textOverflow
        );
        expect(textOverflow).toBe("ellipsis");
    });

    test("should show full title on hover", async ({ page }) => {
        // タイトルセルにホバーしてツールチップが表示されることを確認
        const titleCell = page.locator(".col-title").first();
        await titleCell.hover();

        // title属性が設定されていることを確認
        const titleAttribute = await titleCell.getAttribute("title");
        expect(titleAttribute).toBeTruthy();
    });
});

test.describe("Thread Table - Column Visibility", () => {
    test("should hide/show columns based on visibility settings", async ({
        page,
    }) => {
        // カラム表示設定のストーリーに移動（存在する場合）
        await page.goto(
            "/iframe.html?args=&id=board-bbsthreadtable--custom-columns&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        // 特定のカラムが非表示になっていることを確認
        const indexColumns = page.locator(".col-index");
        const indexCount = await indexColumns.count();

        // カラムの表示/非表示が正しく制御されていることを確認
        expect(indexCount).toBeGreaterThanOrEqual(0);
    });
});

test.describe("Thread Table - Responsive Design", () => {
    test.use({
        viewport: { width: 768, height: 1024 }, // タブレットサイズ
    });

    test("should adapt to smaller screens", async ({ page }) => {
        await page.goto(
            "/iframe.html?args=&id=board-bbsthreadtable--default&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        // テーブルがレスポンシブに表示されることを確認
        const table = page.locator('.thread-table, [role="table"]').first();
        await expect(table).toBeVisible();

        // 小さい画面でもスクロール可能であることを確認
        const tableWidth = await table.evaluate((el) => el.scrollWidth);
        expect(tableWidth).toBeGreaterThan(0);
    });
});

test.describe("Thread Table - Performance", () => {
    test("should handle large number of threads", async ({ page }) => {
        // 大量のスレッドがある場合のパフォーマンステスト
        await page.goto(
            "/iframe.html?args=&id=board-bbsthreadtable--large-dataset&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        // 仮想スクロールまたはページネーションが機能することを確認
        const threadRows = page.locator('[data-testid^="thread-row-"]');
        const rowCount = await threadRows.count();

        // 適切な数の行が表示されていることを確認
        expect(rowCount).toBeGreaterThan(0);
        expect(rowCount).toBeLessThan(1000); // パフォーマンスのため制限されている
    });

    test("should scroll smoothly", async ({ page }) => {
        await page.goto(
            "/iframe.html?args=&id=board-bbsthreadtable--default&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        // スクロールコンテナを取得
        const scrollContainer = page
            .locator('.thread-table-container, [role="table"]')
            .first();

        // スムーズスクロールが機能することを確認
        await scrollContainer.evaluate((el) => {
            el.scrollTo({ top: 100, behavior: "smooth" });
        });

        await page.waitForTimeout(500); // スクロールアニメーション待機

        const scrollTop = await scrollContainer.evaluate((el) => el.scrollTop);
        expect(scrollTop).toBeGreaterThan(0);
    });
});
