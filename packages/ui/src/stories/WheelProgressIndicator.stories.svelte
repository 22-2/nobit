<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import WheelProgressIndicator from "../components/WheelProgressIndicator.svelte";
    import CenterDecorator from "./helpers/CenterDecorator.svelte";

    // defineMeta で Storybook のメタ情報を定義します
    const { Story } = defineMeta({
        // Storybook のサイドバーに表示されるタイトル
        title: "UI/WheelProgressIndicator",
        // 対象のコンポーネント
        component: WheelProgressIndicator,
        // Storybook の Docs ページを自動生成するタグ
        tags: ["autodocs"],
        // Storybook の Controls パネルで操作できる引数を定義
        argTypes: {
            position: {
                control: { type: "select" },
                options: ["top", "bottom"],
                description: "インジケーターの表示位置",
            },
            wheelState: {
                control: "object",
                description: "進捗状況を管理するオブジェクト",
            },
        },
        // CenterDecoratorを使用してコンポーネントを中央に配置し、
        // 絶対配置のコンテキストを提供します
        decorators: [
            (StoryComponent) => ({
                Component: CenterDecorator,
                props: {
                    children: StoryComponent,
                    minHeight: "200px",
                    padding: "1rem",
                },
            }),
        ],
    });
</script>

<!--
  各 Story コンポーネントに name と args を渡すことで、
  様々なバリエーションのストーリーを作成できます。
-->

<!-- 1. デフォルトの状態（下方向へのスクロール途中） -->
<Story
    name="Default"
    args={{
        wheelState: {
            count: 4,
            threshold: 7,
            direction: "down",
            isCoolingDown: false,
            isShowingPostRefresh: false,
        },
        position: "top",
    }}
/>

<!-- 2. プログレスが100%に達した状態 -->
<Story
    name="Progress Full"
    args={{
        wheelState: {
            count: 7,
            threshold: 7,
            direction: "down",
            isCoolingDown: false,
            isShowingPostRefresh: false,
        },
        position: "top",
    }}
/>

<!-- 3. 上方向へのスクロールを示している状態 -->
<Story
    name="Direction Up"
    args={{
        // 'Default'ストーリーのargsを上書き
        ...{
            wheelState: {
                count: 3,
                threshold: 7,
                direction: "up",
                isCoolingDown: false,
                isShowingPostRefresh: false,
            },
        },
    }}
/>

<!-- 4. インジケーターが下部に表示される状態 -->
<Story
    name="Position Bottom"
    args={{
        wheelState: {
            count: 5,
            threshold: 7,
            direction: "down",
            isCoolingDown: false,
            isShowingPostRefresh: false,
        },
        position: "bottom",
    }}
/>

<!-- 5. isCoolingDown が true で非表示になる状態 -->
<Story
    name="Hidden (Cooling Down)"
    args={{
        wheelState: {
            count: 4,
            threshold: 7,
            direction: "down",
            isCoolingDown: true,
            isShowingPostRefresh: false,
        }, // isCoolingDown を wheelState 内に含める
        position: "top",
    }}
/>

<!-- 6. リフレッシュ後のインジケーター表示 (✓) -->
<Story
    name="Post Refresh (Checkmark)"
    args={{
        wheelState: {
            count: 0,
            threshold: 7,
            direction: null,
            isCoolingDown: false,
            isShowingPostRefresh: true,
        }, // isShowingPostRefresh を wheelState 内に含める
        position: "top",
    }}
/>
