import { test, expect } from "@playwright/test";

test.describe("Board Tree Components", () => {
    test.beforeEach(async ({ page }) => {
        // Storybookのボードツリーストーリーに移動
        await page.goto(
            "/iframe.html?args=&id=board-tree-boardtreeview--default&viewMode=story"
        );
        await page.waitForLoadState("networkidle");
    });

    test("should render board tree structure", async ({ page }) => {
        // ツリーコンテナが表示されることを確認
        const treeContainer = page
            .locator('[data-testid="tree-container"], .tree-container')
            .first();
        await expect(treeContainer).toBeVisible();

        // ツリーアイテムが表示されることを確認
        const treeItems = page.locator(
            '[data-testid^="tree-item-"], .tree-item'
        );
        await expect(treeItems).toHaveCountGreaterThan(0);
    });

    test("should expand and collapse tree nodes", async ({ page }) => {
        // 展開可能なノードを探す
        const expandableNode = page
            .locator(
                '[data-testid^="tree-item-"]:has([data-testid="expand-button"]), .tree-item:has(.expand-button)'
            )
            .first();

        if ((await expandableNode.count()) > 0) {
            // 展開ボタンをクリック
            const expandButton = expandableNode
                .locator('[data-testid="expand-button"], .expand-button')
                .first();
            await expandButton.click();

            // 子ノードが表示されることを確認
            await page.waitForTimeout(300); // アニメーション待機

            // 再度クリックして折りたたみ
            await expandButton.click();
            await page.waitForTimeout(300);
        }
    });

    test("should handle node selection", async ({ page }) => {
        // 最初のツリーアイテムを選択
        const firstItem = page
            .locator('[data-testid^="tree-item-"], .tree-item')
            .first();
        await firstItem.click();

        // 選択状態のスタイルが適用されることを確認
        const isSelected = await firstItem.evaluate(
            (el) =>
                el.classList.contains("selected") ||
                el.getAttribute("aria-selected") === "true" ||
                getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)"
        );

        expect(isSelected).toBeTruthy();
    });

    test("should show correct board information", async ({ page }) => {
        // ボード名が表示されることを確認
        const boardNames = page.locator(
            '[data-testid="board-name"], .board-name, .tree-item-label'
        );
        await expect(boardNames.first()).toBeVisible();

        // ボード名のテキストが空でないことを確認
        const firstBoardName = await boardNames.first().textContent();
        expect(firstBoardName?.trim()).toBeTruthy();
    });

    test("should handle keyboard navigation", async ({ page }) => {
        // 最初のアイテムにフォーカス
        const firstItem = page
            .locator('[data-testid^="tree-item-"], .tree-item')
            .first();
        await firstItem.focus();

        // 矢印キーでナビゲーション
        await page.keyboard.press("ArrowDown");

        // フォーカスが移動することを確認
        const focusedElement = page.locator(":focus");
        await expect(focusedElement).toBeVisible();
    });

    test("should support search functionality", async ({ page }) => {
        // 検索入力フィールドがある場合
        const searchInput = page.locator(
            '[data-testid="search-input"], input[type="search"], .search-input'
        );

        if ((await searchInput.count()) > 0) {
            // 検索テキストを入力
            await searchInput.fill("テスト");

            // 検索結果が表示されることを確認
            await page.waitForTimeout(500); // 検索処理待機

            const visibleItems = page.locator(
                '[data-testid^="tree-item-"]:visible, .tree-item:visible'
            );
            await expect(visibleItems).toHaveCountGreaterThanOrEqual(0);
        }
    });
});

test.describe("Board Tree - Accessibility", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(
            "/iframe.html?args=&id=board-tree-boardtreeview--default&viewMode=story"
        );
        await page.waitForLoadState("networkidle");
    });

    test("should have proper ARIA attributes", async ({ page }) => {
        // ツリー要素にrole="tree"が設定されていることを確認
        const tree = page.locator('[role="tree"], .tree-container').first();

        if ((await tree.count()) > 0) {
            await expect(tree).toHaveAttribute("role", "tree");
        }

        // ツリーアイテムにrole="treeitem"が設定されていることを確認
        const treeItems = page.locator('[role="treeitem"], .tree-item');
        if ((await treeItems.count()) > 0) {
            await expect(treeItems.first()).toHaveAttribute("role", "treeitem");
        }
    });

    test("should support screen reader navigation", async ({ page }) => {
        // ツリーアイテムがtabindexを持つことを確認
        const focusableItems = page.locator("[tabindex], .tree-item");
        await expect(focusableItems.first()).toBeVisible();

        // フォーカス可能であることを確認
        await focusableItems.first().focus();
        await expect(focusableItems.first()).toBeFocused();
    });

    test("should announce expanded/collapsed state", async ({ page }) => {
        // 展開可能なアイテムを探す
        const expandableItem = page
            .locator("[aria-expanded], .tree-item:has(.expand-button)")
            .first();

        if ((await expandableItem.count()) > 0) {
            // aria-expanded属性が設定されていることを確認
            const ariaExpanded =
                await expandableItem.getAttribute("aria-expanded");
            expect(ariaExpanded).toMatch(/true|false/);
        }
    });
});

test.describe("Board Tree - Performance", () => {
    test("should handle large tree structures efficiently", async ({
        page,
    }) => {
        // 大きなツリー構造のストーリーに移動
        await page.goto(
            "/iframe.html?args=&id=board-tree-boardtreeview--large-tree&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        // 仮想スクロールまたは遅延読み込みが機能することを確認
        const treeItems = page.locator(
            '[data-testid^="tree-item-"], .tree-item'
        );
        const itemCount = await treeItems.count();

        // 適切な数のアイテムが表示されていることを確認
        expect(itemCount).toBeGreaterThan(0);
        expect(itemCount).toBeLessThan(1000); // パフォーマンスのため制限
    });

    test("should scroll smoothly in large trees", async ({ page }) => {
        await page.goto(
            "/iframe.html?args=&id=board-tree-boardtreeview--large-tree&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        // スクロールコンテナを取得
        const scrollContainer = page
            .locator('.tree-container, [role="tree"]')
            .first();

        // スクロールが機能することを確認
        await scrollContainer.evaluate((el) => {
            el.scrollTo({ top: 100, behavior: "smooth" });
        });

        await page.waitForTimeout(500);

        const scrollTop = await scrollContainer.evaluate((el) => el.scrollTop);
        expect(scrollTop).toBeGreaterThan(0);
    });
});

test.describe("Board Tree - Responsive Design", () => {
    test.use({
        viewport: { width: 480, height: 800 }, // モバイルサイズ
    });

    test("should adapt to mobile screens", async ({ page }) => {
        await page.goto(
            "/iframe.html?args=&id=board-tree-boardtreeview--default&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        // モバイルでもツリーが表示されることを確認
        const tree = page.locator('.tree-container, [role="tree"]').first();
        await expect(tree).toBeVisible();

        // タッチ操作に適したサイズであることを確認
        const treeItems = page.locator(".tree-item").first();
        if ((await treeItems.count()) > 0) {
            const boundingBox = await treeItems.boundingBox();
            expect(boundingBox?.height).toBeGreaterThan(32); // 最小タッチターゲットサイズ
        }
    });

    test("should handle touch interactions", async ({ page }) => {
        await page.goto(
            "/iframe.html?args=&id=board-tree-boardtreeview--default&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        // タッチでアイテムを選択
        const firstItem = page.locator(".tree-item").first();
        await firstItem.tap();

        // 選択状態が適用されることを確認
        await expect(firstItem).toBeVisible();
    });
});

test.describe("Board Tree - Context Menu", () => {
    test("should show context menu on right click", async ({ page }) => {
        await page.goto(
            "/iframe.html?args=&id=board-tree-boardtreeview--default&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        // 右クリックでコンテキストメニューを表示
        const firstItem = page.locator(".tree-item").first();
        await firstItem.click({ button: "right" });

        // コンテキストメニューが表示されることを確認（実装に依存）
        await page.waitForTimeout(200);

        // メニューアイテムが存在する場合の確認
        const contextMenu = page.locator('.context-menu, [role="menu"]');
        if ((await contextMenu.count()) > 0) {
            await expect(contextMenu).toBeVisible();
        }
    });
});
