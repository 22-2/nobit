<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import LoadingSpinner from "../components/LoadingSpinner.svelte";
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
                options: ["small", "medium", "large"],
                description: "スピナーのサイズ",
            },
            color: {
                control: { type: "color" },
                description: "スピナーの色",
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

<!-- 4. カスタムカラー（青） -->
<Story
    name="Custom Color Blue"
    args={{
        size: "medium",
        color: "#007acc",
        strokeWidth: 2,
        speed: "normal",
    }}
/>

<!-- 5. カスタムカラー（緑） -->
<Story
    name="Custom Color Green"
    args={{
        size: "medium",
        color: "#28a745",
        strokeWidth: 2,
        speed: "normal",
    }}
/>

<!-- 6. 太い線 -->
<Story
    name="Thick Stroke"
    args={{
        size: "medium",
        color: "var(--interactive-accent)",
        strokeWidth: 4,
        speed: "normal",
    }}
/>

<!-- 7. 細い線 -->
<Story
    name="Thin Stroke"
    args={{
        size: "medium",
        color: "var(--interactive-accent)",
        strokeWidth: 1,
        speed: "normal",
    }}
/>

<!-- 8. 高速アニメーション -->
<Story
    name="Fast Animation"
    args={{
        size: "medium",
        color: "var(--interactive-accent)",
        strokeWidth: 2,
        speed: "fast",
    }}
/>

<!-- 9. 低速アニメーション -->
<Story
    name="Slow Animation"
    args={{
        size: "medium",
        color: "var(--interactive-accent)",
        strokeWidth: 2,
        speed: "slow",
    }}
/>

<!-- 10. 複数のスピナーを並べて表示 -->
<Story name="Multiple Sizes">
    <CenterDecorator>
        <div
            style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2rem;
        "
        >
            <div style="text-align: center;">
                <LoadingSpinner size="small" />
                <p style="margin-top: 0.5rem; font-size: 0.8rem;">Small</p>
            </div>
            <div style="text-align: center;">
                <LoadingSpinner size="medium" />
                <p style="margin-top: 0.5rem; font-size: 0.8rem;">Medium</p>
            </div>
            <div style="text-align: center;">
                <LoadingSpinner size="large" />
                <p style="margin-top: 0.5rem; font-size: 0.8rem;">Large</p>
            </div>
        </div>
    </CenterDecorator>
</Story>

<!-- 11. 異なる速度のスピナーを並べて表示 -->
<Story name="Different Speeds">
    <CenterDecorator>
        <div
            style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2rem;
        "
        >
            <div style="text-align: center;">
                <LoadingSpinner speed="slow" />
                <p style="margin-top: 0.5rem; font-size: 0.8rem;">Slow</p>
            </div>
            <div style="text-align: center;">
                <LoadingSpinner speed="normal" />
                <p style="margin-top: 0.5rem; font-size: 0.8rem;">Normal</p>
            </div>
            <div style="text-align: center;">
                <LoadingSpinner speed="fast" />
                <p style="margin-top: 0.5rem; font-size: 0.8rem;">Fast</p>
            </div>
        </div>
    </CenterDecorator>
</Story>

<!-- 12. ダークテーマでの表示例 -->
<Story name="Dark Theme">
    <CenterDecorator backgroundColor="#1e1e1e" borderRadius="8px">
        <LoadingSpinner color="#ffffff" />
    </CenterDecorator>
</Story>
