import { expect, userEvent, within, waitFor } from "storybook/test";

/**
 * インタラクションテスト用のヘルパー関数集
 */

/**
 * 要素がアニメーション完了まで待機
 */
export async function waitForAnimation(element: HTMLElement, timeout = 1000) {
    return new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {
            if (!element.getAnimations().length) {
                observer.disconnect();
                resolve();
            }
        });

        observer.observe(element, {
            attributes: true,
            attributeFilter: ["class", "style"],
        });

        // タイムアウト処理
        setTimeout(() => {
            observer.disconnect();
            resolve();
        }, timeout);
    });
}

/**
 * フォーカストラップのテスト
 */
export async function testFocusTrap(
    canvasElement: HTMLElement,
    containerSelector: string,
    focusableSelectors: string[]
) {
    const canvas = within(canvasElement);
    const container = await canvas.findByTestId(containerSelector);

    // 最初の要素にフォーカスが当たることを確認
    const firstElement = container.querySelector(
        focusableSelectors[0]
    ) as HTMLElement;
    expect(firstElement).toHaveFocus();

    // Tabキーで順番にフォーカスが移動することを確認
    for (let i = 1; i < focusableSelectors.length; i++) {
        await userEvent.keyboard("{Tab}");
        const nextElement = container.querySelector(
            focusableSelectors[i]
        ) as HTMLElement;
        expect(nextElement).toHaveFocus();
    }

    // 最後の要素からTabで最初に戻ることを確認
    await userEvent.keyboard("{Tab}");
    expect(firstElement).toHaveFocus();

    // Shift+Tabで逆順にフォーカスが移動することを確認
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    const lastElement = container.querySelector(
        focusableSelectors[focusableSelectors.length - 1]
    ) as HTMLElement;
    expect(lastElement).toHaveFocus();
}

/**
 * キーボードナビゲーションのテスト
 */
export async function testKeyboardNavigation(
    canvasElement: HTMLElement,
    testCases: Array<{
        key: string;
        expectedAction: () => Promise<void> | void;
        description: string;
    }>
) {
    for (const testCase of testCases) {
        await userEvent.keyboard(testCase.key);
        await testCase.expectedAction();
    }
}

/**
 * アクセシビリティ属性のテスト
 */
export function testAccessibilityAttributes(
    element: HTMLElement,
    expectedAttributes: Record<string, string | boolean>
) {
    Object.entries(expectedAttributes).forEach(([attr, value]) => {
        if (typeof value === "boolean") {
            if (value) {
                expect(element).toHaveAttribute(attr);
            } else {
                expect(element).not.toHaveAttribute(attr);
            }
        } else {
            expect(element).toHaveAttribute(attr, value);
        }
    });
}

/**
 * レスポンシブ動作のテスト
 */
export async function testResponsiveBehavior(
    canvasElement: HTMLElement,
    breakpoints: Array<{
        width: number;
        height: number;
        expectedChanges: () => Promise<void> | void;
        description: string;
    }>
) {
    for (const breakpoint of breakpoints) {
        // ビューポートサイズを変更
        Object.assign(canvasElement.style, {
            width: `${breakpoint.width}px`,
            height: `${breakpoint.height}px`,
        });

        // 変更を待機
        await waitFor(() => {
            // レイアウトの再計算を待つ
            return new Promise((resolve) => requestAnimationFrame(resolve));
        });

        await breakpoint.expectedChanges();
    }
}

/**
 * フォーム送信のテスト
 */
export async function testFormSubmission(
    canvasElement: HTMLElement,
    formData: Record<string, string>,
    submitButtonSelector: string,
    expectedResult?: () => Promise<void> | void
) {
    const canvas = within(canvasElement);

    // フォームフィールドに値を入力
    for (const [fieldName, value] of Object.entries(formData)) {
        const field = await canvas.findByLabelText(new RegExp(fieldName, "i"));
        await userEvent.clear(field);
        await userEvent.type(field, value);
    }

    // 送信ボタンをクリック
    const submitButton = await canvas.findByTestId(submitButtonSelector);
    await userEvent.click(submitButton);

    // 期待される結果をテスト
    if (expectedResult) {
        await expectedResult();
    }
}

/**
 * ドラッグ&ドロップのテスト
 */
export async function testDragAndDrop(
    canvasElement: HTMLElement,
    sourceSelector: string,
    targetSelector: string,
    expectedResult?: () => Promise<void> | void
) {
    const canvas = within(canvasElement);

    const sourceElement = await canvas.findByTestId(sourceSelector);
    const targetElement = await canvas.findByTestId(targetSelector);

    // ドラッグ開始
    await userEvent.pointer([
        { target: sourceElement, keys: "[MouseLeft>]" },
        { coords: { x: 0, y: 0 } },
    ]);

    // ドロップ
    await userEvent.pointer([
        { target: targetElement },
        { keys: "[/MouseLeft]" },
    ]);

    if (expectedResult) {
        await expectedResult();
    }
}

/**
 * 非同期データ読み込みのテスト
 */
export async function testAsyncDataLoading(
    canvasElement: HTMLElement,
    triggerSelector: string,
    loadingIndicatorSelector: string,
    contentSelector: string,
    timeout = 5000
) {
    const canvas = within(canvasElement);

    // データ読み込みをトリガー
    const trigger = await canvas.findByTestId(triggerSelector);
    await userEvent.click(trigger);

    // ローディング表示を確認
    const loadingIndicator = await canvas.findByTestId(
        loadingIndicatorSelector
    );
    expect(loadingIndicator).toBeInTheDocument();

    // データ読み込み完了を待機
    await waitFor(
        async () => {
            const content = await canvas.findByTestId(contentSelector);
            expect(content).toBeInTheDocument();
        },
        { timeout }
    );

    // ローディング表示が消えることを確認
    expect(
        canvas.queryByTestId(loadingIndicatorSelector)
    ).not.toBeInTheDocument();
}
