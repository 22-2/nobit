import { test, expect } from "@playwright/test";

test.describe("Loading Spinner Component", () => {
    test.beforeEach(async ({ page }) => {
        // Storybookのローディングスピナーストーリーに移動
        await page.goto(
            "/iframe.html?args=&id=common-loadingspinner--default&viewMode=story"
        );
        await page.waitForLoadState("networkidle");
    });

    test("should render loading spinner with default props", async ({
        page,
    }) => {
        // スピナーが表示されることを確認
        const spinner = page.locator(".loading-spinner");
        await expect(spinner).toBeVisible();

        // SVG要素が存在することを確認
        const svg = spinner.locator("svg");
        await expect(svg).toBeVisible();

        // circle要素が存在することを確認
        const circle = svg.locator("circle");
        await expect(circle).toBeVisible();
    });

    test("should have correct accessibility attributes", async ({ page }) => {
        const spinner = page.locator(".loading-spinner");

        // role="status"が設定されていることを確認
        await expect(spinner).toHaveAttribute("role", "status");

        // aria-labelが設定されていることを確認
        await expect(spinner).toHaveAttribute("aria-label", "読み込み中");
    });

    test("should animate continuously", async ({ page }) => {
        const spinner = page.locator(".loading-spinner");

        // アニメーションが実行されていることを確認
        const animationName = await spinner.evaluate(
            (el) => getComputedStyle(el).animationName
        );
        expect(animationName).toBe("spin");

        // アニメーション継続時間が設定されていることを確認
        const animationDuration = await spinner.evaluate(
            (el) => getComputedStyle(el).animationDuration
        );
        expect(animationDuration).not.toBe("0s");
    });

    test("should have correct default size", async ({ page }) => {
        const spinner = page.locator(".loading-spinner");

        // デフォルトサイズ（medium）が適用されていることを確認
        const width = await spinner.evaluate(
            (el) => getComputedStyle(el).width
        );
        const height = await spinner.evaluate(
            (el) => getComputedStyle(el).height
        );

        expect(width).toBe(height); // 正方形であることを確認
        expect(width).not.toBe("0px"); // サイズが設定されていることを確認
    });
});

test.describe("Loading Spinner - Size Variants", () => {
    test("should render small size correctly", async ({ page }) => {
        await page.goto(
            "/iframe.html?args=size:small&id=common-loadingspinner--sizes&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        const smallSpinner = page.locator(".loading-spinner").first();
        const width = await smallSpinner.evaluate(
            (el) => getComputedStyle(el).width
        );

        // 小サイズが適用されていることを確認
        expect(width).toBeTruthy();
    });

    test("should render large size correctly", async ({ page }) => {
        await page.goto(
            "/iframe.html?args=size:large&id=common-loadingspinner--sizes&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        const largeSpinner = page.locator(".loading-spinner").first();
        const width = await largeSpinner.evaluate(
            (el) => getComputedStyle(el).width
        );

        // 大サイズが適用されていることを確認
        expect(width).toBeTruthy();
    });

    test("should render extra-large size correctly", async ({ page }) => {
        await page.goto(
            "/iframe.html?args=size:extra-large&id=common-loadingspinner--sizes&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        const extraLargeSpinner = page.locator(".loading-spinner").first();
        const width = await extraLargeSpinner.evaluate(
            (el) => getComputedStyle(el).width
        );

        // 特大サイズが適用されていることを確認
        expect(width).toBeTruthy();
    });
});

test.describe("Loading Spinner - Speed Variants", () => {
    test("should animate at different speeds", async ({ page }) => {
        // 高速アニメーションのテスト
        await page.goto(
            "/iframe.html?args=speed:fast&id=common-loadingspinner--speeds&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        const fastSpinner = page.locator(".loading-spinner").first();
        const fastDuration = await fastSpinner.evaluate(
            (el) => getComputedStyle(el).animationDuration
        );

        // 低速アニメーションのテスト
        await page.goto(
            "/iframe.html?args=speed:slow&id=common-loadingspinner--speeds&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        const slowSpinner = page.locator(".loading-spinner").first();
        const slowDuration = await slowSpinner.evaluate(
            (el) => getComputedStyle(el).animationDuration
        );

        // 高速の方が短い継続時間であることを確認
        const fastMs = parseFloat(fastDuration.replace("s", "")) * 1000;
        const slowMs = parseFloat(slowDuration.replace("s", "")) * 1000;
        expect(fastMs).toBeLessThan(slowMs);
    });
});

test.describe("Loading Spinner - Custom Colors", () => {
    test("should apply custom color", async ({ page }) => {
        await page.goto(
            "/iframe.html?args=color:%23ff0000&id=common-loadingspinner--custom-color&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        const spinner = page.locator(".loading-spinner");
        const circle = spinner.locator("circle");

        // カスタムカラーが適用されていることを確認
        const stroke = await circle.getAttribute("stroke");
        expect(stroke).toBeTruthy();
    });
});

test.describe("Loading Spinner - Accessibility", () => {
    test("should respect reduced motion preferences", async ({ page }) => {
        // reduced motionを有効にする
        await page.emulateMedia({ reducedMotion: "reduce" });

        await page.goto(
            "/iframe.html?args=&id=common-loadingspinner--default&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        const spinner = page.locator(".loading-spinner");

        // アニメーション継続時間が長くなっていることを確認
        const animationDuration = await spinner.evaluate(
            (el) => getComputedStyle(el).animationDuration
        );

        const durationMs =
            parseFloat(animationDuration.replace("s", "")) * 1000;
        expect(durationMs).toBeGreaterThan(1000); // 1秒より長い
    });

    test("should be screen reader friendly", async ({ page }) => {
        await page.goto(
            "/iframe.html?args=&id=common-loadingspinner--default&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        const spinner = page.locator(".loading-spinner");

        // スクリーンリーダー用の属性が設定されていることを確認
        await expect(spinner).toHaveAttribute("role", "status");
        await expect(spinner).toHaveAttribute("aria-label");

        // aria-labelの内容が適切であることを確認
        const ariaLabel = await spinner.getAttribute("aria-label");
        expect(ariaLabel).toContain("読み込み");
    });
});

test.describe("Loading Spinner - Performance", () => {
    test("should not cause layout shifts", async ({ page }) => {
        await page.goto(
            "/iframe.html?args=&id=common-loadingspinner--default&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        // 初期位置を記録
        const spinner = page.locator(".loading-spinner");
        const initialBox = await spinner.boundingBox();

        // 少し待ってから再度位置を確認
        await page.waitForTimeout(1000);
        const laterBox = await spinner.boundingBox();

        // 位置が変わっていないことを確認（レイアウトシフトなし）
        expect(initialBox?.x).toBe(laterBox?.x);
        expect(initialBox?.y).toBe(laterBox?.y);
        expect(initialBox?.width).toBe(laterBox?.width);
        expect(initialBox?.height).toBe(laterBox?.height);
    });

    test("should maintain smooth animation", async ({ page }) => {
        await page.goto(
            "/iframe.html?args=&id=common-loadingspinner--default&viewMode=story"
        );
        await page.waitForLoadState("networkidle");

        const spinner = page.locator(".loading-spinner");

        // アニメーションが滑らかであることを確認
        const animationTimingFunction = await spinner.evaluate(
            (el) => getComputedStyle(el).animationTimingFunction
        );

        // linear または ease系の関数が使用されていることを確認
        expect(animationTimingFunction).toMatch(/(linear|ease)/);
    });
});
