<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import LoadingSpinner from "../view/common/LoadingSpinner.svelte";
    import CenterDecorator from "./helpers/CenterDecorator.svelte";

    // defineMeta で Storybook のメタ情報を定義します
    const { Story } = defineMeta({
        // Storybook のサイドバーに表示されるタイトル
        title: "UI/LoadingSpinner",
        // 対象のコンポーネント
        component: LoadingSpinner,
        // Storybook の Docs ページを自動生成するタグ
        tags: ["autodocs"],
        // Storybook の Controls パネルで操作できる引数を定義
        argTypes: {
            size: {
                control: { type: "select" },
                options: ["small", "medium", "large", "extra-large"],
                description:
                    "スピナーのサイズ（Obsidianの4pxグリッドに基づく）",
            },
            color: {
                control: { type: "color" },
                description: "スピナーの色（Obsidianのカラー変数推奨）",
            },
            strokeWidth: {
                control: { type: "range", min: 1, max: 5, step: 0.5 },
                description: "線の太さ",
            },
            speed: {
                control: { type: "select" },
                options: ["slow", "normal", "fast"],
                description: "アニメーションの速度",
            },
        },
        // CenterDecoratorを使用してコンポーネントを中央に配置
        decorators: [
            (StoryComponent) => ({
                Component: CenterDecorator,
                props: {
                    children: StoryComponent,
                },
            }),
        ],
    });
</script>

<!--
  各 Story コンポーネントに name と args を渡すことで、
  様々なバリエーションのストーリーを作成できます。
-->

<!-- 1. デフォルトの状態 -->
<Story
    name="Default"
    args={{
        size: "medium",
        color: "var(--interactive-accent)",
        strokeWidth: 2,
        speed: "normal",
    }}
/>

<!-- 2. 小さいサイズ -->
<Story
    name="Small"
    args={{
        size: "small",
        color: "var(--interactive-accent)",
        strokeWidth: 2,
        speed: "normal",
    }}
/>

<!-- 3. 大きいサイズ -->
<Story
    name="Large"
    args={{
        size: "large",
        color: "var(--interactive-accent)",
        strokeWidth: 2,
        speed: "normal",
    }}
/>

<!-- 4. 特大サイズ -->
<Story
    name="Extra Large"
    args={{
        size: "extra-large",
        color: "var(--interactive-accent)",
        strokeWidth: 2,
        speed: "normal",
    }}
/>

<!-- 5. Obsidianテーマカラー（成功） -->
<Story
    name="Success Color"
    args={{
        size: "medium",
        color: "var(--color-green)",
        strokeWidth: 2,
        speed: "normal",
    }}
/>

<!-- 6. Obsidianテーマカラー（警告） -->
<Story
    name="Warning Color"
    args={{
        size: "medium",
        color: "var(--color-orange)",
        strokeWidth: 2,
        speed: "normal",
    }}
/>

<!-- 7. Obsidianテーマカラー（エラー） -->
<Story
    name="Error Color"
    args={{
        size: "medium",
        color: "var(--color-red)",
        strokeWidth: 2,
        speed: "normal",
    }}
/>

<!-- 8. 太い線 -->
<Story
    name="Thick Stroke"
    args={{
        size: "medium",
        color: "var(--interactive-accent)",
        strokeWidth: 4,
        speed: "normal",
    }}
/>

<!-- 9. 細い線 -->
<Story
    name="Thin Stroke"
    args={{
        size: "medium",
        color: "var(--interactive-accent)",
        strokeWidth: 1,
        speed: "normal",
    }}
/>

<!-- 10. 高速アニメーション -->
<Story
    name="Fast Animation"
    args={{
        size: "medium",
        color: "var(--interactive-accent)",
        strokeWidth: 2,
        speed: "fast",
    }}
/>

<!-- 11. 低速アニメーション -->
<Story
    name="Slow Animation"
    args={{
        size: "medium",
        color: "var(--interactive-accent)",
        strokeWidth: 2,
        speed: "slow",
    }}
/>

<!-- 12. 複数のスピナーを並べて表示（Obsidianスペーシング使用） -->
<Story name="Multiple Sizes">
    <CenterDecorator>
        <div
            style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--size-4-8);
        "
        >
            <div style="text-align: center;">
                <LoadingSpinner size="small" />
                <p
                    style="margin-top: var(--size-4-2); font-size: var(--font-ui-small);"
                >
                    Small (16px)
                </p>
            </div>
            <div style="text-align: center;">
                <LoadingSpinner size="medium" />
                <p
                    style="margin-top: var(--size-4-2); font-size: var(--font-ui-small);"
                >
                    Medium (24px)
                </p>
            </div>
            <div style="text-align: center;">
                <LoadingSpinner size="large" />
                <p
                    style="margin-top: var(--size-4-2); font-size: var(--font-ui-small);"
                >
                    Large (32px)
                </p>
            </div>
            <div style="text-align: center;">
                <LoadingSpinner size="extra-large" />
                <p
                    style="margin-top: var(--size-4-2); font-size: var(--font-ui-small);"
                >
                    Extra Large (48px)
                </p>
            </div>
        </div>
    </CenterDecorator>
</Story>

<!-- 13. 異なる速度のスピナーを並べて表示 -->
<Story name="Different Speeds">
    <CenterDecorator>
        <div
            style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--size-4-8);
        "
        >
            <div style="text-align: center;">
                <LoadingSpinner speed="slow" />
                <p
                    style="margin-top: var(--size-4-2); font-size: var(--font-ui-small);"
                >
                    Slow
                </p>
            </div>
            <div style="text-align: center;">
                <LoadingSpinner speed="normal" />
                <p
                    style="margin-top: var(--size-4-2); font-size: var(--font-ui-small);"
                >
                    Normal
                </p>
            </div>
            <div style="text-align: center;">
                <LoadingSpinner speed="fast" />
                <p
                    style="margin-top: var(--size-4-2); font-size: var(--font-ui-small);"
                >
                    Fast
                </p>
            </div>
        </div>
    </CenterDecorator>
</Story>

<!-- 14. Obsidianカラーバリエーション -->
<Story name="Obsidian Color Variations">
    <CenterDecorator>
        <div
            style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--size-4-6);
            flex-wrap: wrap;
        "
        >
            <div style="text-align: center;">
                <LoadingSpinner color="var(--interactive-accent)" />
                <p
                    style="margin-top: var(--size-4-1); font-size: var(--font-ui-smaller);"
                >
                    Accent
                </p>
            </div>
            <div style="text-align: center;">
                <LoadingSpinner color="var(--text-normal)" />
                <p
                    style="margin-top: var(--size-4-1); font-size: var(--font-ui-smaller);"
                >
                    Normal
                </p>
            </div>
            <div style="text-align: center;">
                <LoadingSpinner color="var(--text-muted)" />
                <p
                    style="margin-top: var(--size-4-1); font-size: var(--font-ui-smaller);"
                >
                    Muted
                </p>
            </div>
            <div style="text-align: center;">
                <LoadingSpinner color="var(--color-green)" />
                <p
                    style="margin-top: var(--size-4-1); font-size: var(--font-ui-smaller);"
                >
                    Success
                </p>
            </div>
            <div style="text-align: center;">
                <LoadingSpinner color="var(--color-orange)" />
                <p
                    style="margin-top: var(--size-4-1); font-size: var(--font-ui-smaller);"
                >
                    Warning
                </p>
            </div>
            <div style="text-align: center;">
                <LoadingSpinner color="var(--color-red)" />
                <p
                    style="margin-top: var(--size-4-1); font-size: var(--font-ui-smaller);"
                >
                    Error
                </p>
            </div>
        </div>
    </CenterDecorator>
</Story>
