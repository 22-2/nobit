import { Page, Locator, expect } from "@playwright/test";

/**
 * E2Eテスト用のヘルパー関数集
 */

/**
 * Storybookの特定のストーリーに移動
 */
export async function navigateToStory(
    page: Page,
    storyId: string,
    args?: Record<string, any>
) {
    const argsParam = args
        ? `&args=${encodeURIComponent(
              Object.entries(args)
                  .map(([k, v]) => `${k}:${v}`)
                  .join(";")
          )}`
        : "";
    await page.goto(`/iframe.html?id=${storyId}&viewMode=story${argsParam}`);
    await page.waitForLoadState("networkidle");
}

/**
 * 要素が表示されるまで待機
 */
export async function waitForElement(
    page: Page,
    selector: string,
    timeout = 5000
) {
    const element = page.locator(selector);
    await expect(element).toBeVisible({ timeout });
    return element;
}

/**
 * アニメーションの完了を待機
 */
export async function waitForAnimation(element: Locator, timeout = 2000) {
    await element.evaluate((el, timeout) => {
        return new Promise<void>((resolve) => {
            const checkAnimations = () => {
                const animations = el.getAnimations();
                if (animations.length === 0) {
                    resolve();
                } else {
                    setTimeout(checkAnimations, 50);
                }
            };

            checkAnimations();

            // タイムアウト処理
            setTimeout(() => resolve(), timeout);
        });
    }, timeout);
}

/**
 * CSS変数の値を取得
 */
export async function getCSSVariable(
    element: Locator,
    variableName: string
): Promise<string> {
    return await element.evaluate((el, varName) => {
        return getComputedStyle(el).getPropertyValue(varName).trim();
    }, variableName);
}

/**
 * 要素のバウンディングボックスを取得
 */
export async function getBoundingBox(element: Locator) {
    const box = await element.boundingBox();
    if (!box) {
        throw new Error("Element bounding box not found");
    }
    return box;
}

/**
 * スクロール位置を設定
 */
export async function scrollTo(element: Locator, x: number, y: number) {
    await element.evaluate(
        (el, { x, y }) => {
            el.scrollTo({ left: x, top: y, behavior: "smooth" });
        },
        { x, y }
    );
}

/**
 * 要素がビューポート内にあるかチェック
 */
export async function isInViewport(element: Locator): Promise<boolean> {
    return await element.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <=
                (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <=
                (window.innerWidth || document.documentElement.clientWidth)
        );
    });
}

/**
 * キーボードショートカットを実行
 */
export async function pressKeyboardShortcut(page: Page, shortcut: string) {
    const keys = shortcut.split("+").map((key) => key.trim());
    const modifiers = keys.slice(0, -1);
    const mainKey = keys[keys.length - 1];

    let keyString = "";
    if (modifiers.includes("Ctrl") || modifiers.includes("Control"))
        keyString += "Control+";
    if (modifiers.includes("Shift")) keyString += "Shift+";
    if (modifiers.includes("Alt")) keyString += "Alt+";
    if (modifiers.includes("Meta") || modifiers.includes("Cmd"))
        keyString += "Meta+";

    keyString += mainKey;

    await page.keyboard.press(keyString);
}

/**
 * フォーカストラップのテスト
 */
export async function testFocusTrap(
    page: Page,
    containerSelector: string,
    focusableSelectors: string[]
) {
    const container = page.locator(containerSelector);
    await expect(container).toBeVisible();

    // 最初の要素にフォーカスが当たることを確認
    const firstElement = container.locator(focusableSelectors[0]);
    await expect(firstElement).toBeFocused();

    // Tabキーで順番にフォーカスが移動することを確認
    for (let i = 1; i < focusableSelectors.length; i++) {
        await page.keyboard.press("Tab");
        const nextElement = container.locator(focusableSelectors[i]);
        await expect(nextElement).toBeFocused();
    }

    // 最後の要素からTabで最初に戻ることを確認
    await page.keyboard.press("Tab");
    await expect(firstElement).toBeFocused();

    // Shift+Tabで逆順にフォーカスが移動することを確認
    await page.keyboard.press("Shift+Tab");
    const lastElement = container.locator(
        focusableSelectors[focusableSelectors.length - 1]
    );
    await expect(lastElement).toBeFocused();
}

/**
 * アクセシビリティ属性のテスト
 */
export async function testAccessibilityAttributes(
    element: Locator,
    expectedAttributes: Record<string, string | boolean>
) {
    for (const [attr, expectedValue] of Object.entries(expectedAttributes)) {
        if (typeof expectedValue === "boolean") {
            if (expectedValue) {
                await expect(element).toHaveAttribute(attr);
            } else {
                await expect(element).not.toHaveAttribute(attr);
            }
        } else {
            await expect(element).toHaveAttribute(attr, expectedValue);
        }
    }
}

/**
 * レスポンシブ動作のテスト
 */
export async function testResponsiveBehavior(
    page: Page,
    breakpoints: Array<{
        width: number;
        height: number;
        test: () => Promise<void>;
        description: string;
    }>
) {
    for (const breakpoint of breakpoints) {
        await page.setViewportSize({
            width: breakpoint.width,
            height: breakpoint.height,
        });
        await page.waitForTimeout(300); // レイアウト調整待機
        await breakpoint.test();
    }
}

/**
 * パフォーマンス測定
 */
export async function measurePerformance(
    page: Page,
    action: () => Promise<void>
) {
    const startTime = Date.now();
    await action();
    const endTime = Date.now();
    return endTime - startTime;
}

/**
 * ネットワーク要求の監視
 */
export async function monitorNetworkRequests(
    page: Page,
    urlPattern: string | RegExp
) {
    const requests: any[] = [];

    page.on("request", (request) => {
        const url = request.url();
        const matches =
            typeof urlPattern === "string"
                ? url.includes(urlPattern)
                : urlPattern.test(url);

        if (matches) {
            requests.push({
                url,
                method: request.method(),
                headers: request.headers(),
                timestamp: Date.now(),
            });
        }
    });

    return requests;
}

/**
 * コンソールエラーの監視
 */
export async function monitorConsoleErrors(page: Page) {
    const errors: string[] = [];

    page.on("console", (msg) => {
        if (msg.type() === "error") {
            errors.push(msg.text());
        }
    });

    return errors;
}

/**
 * ローカルストレージの操作
 */
export async function setLocalStorage(page: Page, key: string, value: string) {
    await page.evaluate(
        ({ key, value }) => {
            localStorage.setItem(key, value);
        },
        { key, value }
    );
}

export async function getLocalStorage(
    page: Page,
    key: string
): Promise<string | null> {
    return await page.evaluate((key) => {
        return localStorage.getItem(key);
    }, key);
}

/**
 * セッションストレージの操作
 */
export async function setSessionStorage(
    page: Page,
    key: string,
    value: string
) {
    await page.evaluate(
        ({ key, value }) => {
            sessionStorage.setItem(key, value);
        },
        { key, value }
    );
}

export async function getSessionStorage(
    page: Page,
    key: string
): Promise<string | null> {
    return await page.evaluate((key) => {
        return sessionStorage.getItem(key);
    }, key);
}
