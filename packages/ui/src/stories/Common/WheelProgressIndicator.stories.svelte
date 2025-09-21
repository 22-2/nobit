<!-- E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\stories\common\WheelProgressIndicator.stories.svelte -->
<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import WheelProgressIndicator from "../../view/common/WheelProgressIndicator.svelte";
    import CenterDecorator from "../helpers/CenterDecorator.svelte";

    // defineMeta で Storybook のメタ情報を定義します
    const { Story } = defineMeta({
        // Storybook のサイドバーに表示されるタイトル
        title: "Common/WheelProgressIndicator",
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
                    minHeight: "var(--size-4-50)" /* 200px相当 */,
                    padding: "var(--size-4-4)" /* 16px */,
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
            status: "wheeling",
            count: 4,
            threshold: 7,
            direction: "down",
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
            status: "wheeling",
            count: 7,
            threshold: 7,
            direction: "down",
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
                status: "wheeling",
                count: 3,
                threshold: 7,
                direction: "up",
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
            status: "wheeling",
            count: 5,
            threshold: 7,
            direction: "down",
            isShowingPostRefresh: false,
        },
        position: "bottom",
    }}
/>

<!-- 5. status が 'coolingDown' で非表示になる状態 -->
<Story
    name="Hidden (Cooling Down)"
    args={{
        wheelState: {
            status: "coolingDown",
            count: 4,
            threshold: 7,
            direction: "down",
            isShowingPostRefresh: false,
        },
        position: "top",
    }}
/>

<!-- 6. リフレッシュ後のインジケーター表示 (✅️) -->
<Story
    name="Post Refresh (Checkmark)"
    args={{
        wheelState: {
            status: "coolingDown",
            count: 0,
            threshold: 7,
            direction: null,
            isShowingPostRefresh: true,
        },
        position: "top",
    }}
/>
