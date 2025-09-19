<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import InlineWriteForm from "../components/InlineWriteForm.svelte";
    import CenterDecorator from "./helpers/CenterDecorator.svelte";
    import { fn } from "storybook/test";

    const { Story } = defineMeta({
        title: "UI/InlineWriteForm",
        component: InlineWriteForm,
        tags: ["autodocs"],
        argTypes: {
            handlePost: {
                action: "handlePost",
                description: "投稿処理を行う非同期関数",
            },
            onCancel: {
                action: "onCancel",
                description: "キャンセル時のコールバック",
            },
            isSubmitting: {
                control: "boolean",
                description: "投稿中かどうかの状態",
            },
        },
        decorators: [
            (StoryComponent) => ({
                Component: CenterDecorator,
                props: {
                    children: StoryComponent,
                    padding: "var(--size-4-4)",
                    minHeight: "var(--size-4-50)",
                },
            }),
        ],
    });
</script>

<!-- デフォルトの状態 -->
<Story
    name="Default"
    args={{
        handlePost: fn(async (postData) => {
            console.log("投稿データ:", postData);
            // 成功をシミュレート
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }),
        onCancel: fn(),
        isSubmitting: false,
    }}
/>

<!-- 投稿中の状態 -->
<Story
    name="Submitting"
    args={{
        handlePost: fn(async (postData) => {
            console.log("投稿データ:", postData);
            // 長い処理をシミュレート
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }),
        onCancel: fn(),
        isSubmitting: true,
    }}
/>

<!-- 投稿エラーのシミュレーション -->
<Story
    name="Post Error"
    args={{
        handlePost: fn(async (postData) => {
            console.log("投稿データ:", postData);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            throw new Error("投稿に失敗しました");
        }),
        onCancel: fn(),
        isSubmitting: false,
    }}
/>

<!-- 成功後の自動クリア -->
<Story
    name="Auto Clear on Success"
    args={{
        handlePost: fn(async (postData) => {
            console.log("投稿データ:", postData);
            await new Promise((resolve) => setTimeout(resolve, 500));
            // 成功時は自動的にフォームがクリアされ、onCancelが呼ばれる
        }),
        onCancel: fn(),
        isSubmitting: false,
    }}
/>

<!-- 遅いネットワークのシミュレーション -->
<Story
    name="Slow Network"
    args={{
        handlePost: fn(async (postData) => {
            console.log("投稿データ:", postData);
            // 5秒の遅延をシミュレート
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }),
        onCancel: fn(),
        isSubmitting: false,
    }}
/>

<!-- インタラクティブなテスト用 -->
<Story name="Interactive Test">
    <CenterDecorator padding="var(--size-4-4)" minHeight="var(--size-4-50)">
        <div style="width: 100%; max-width: 600px;">
            <h3
                style="margin-bottom: var(--size-4-4); color: var(--text-normal);"
            >
                インタラクティブテスト
            </h3>
            <p
                style="margin-bottom: var(--size-4-4); color: var(--text-muted); font-size: 0.9em;"
            >
                実際にテキストを入力して投稿ボタンを押してみてください。
                コンソールに投稿データが表示されます。
            </p>
            <InlineWriteForm
                handlePost={async (postData) => {
                    console.log("投稿データ:", postData);
                    alert(`投稿内容: ${postData.content}`);
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }}
                onCancel={() => {
                    console.log("キャンセルされました");
                    alert("キャンセルされました");
                }}
                isSubmitting={false}
            />
        </div>
    </CenterDecorator>
</Story>

<!-- 長いテキストのテスト -->
<Story name="Long Text Test">
    <CenterDecorator padding="var(--size-4-4)" minHeight="var(--size-4-75)">
        <div style="width: 100%; max-width: 600px;">
            <h3
                style="margin-bottom: var(--size-4-4); color: var(--text-normal);"
            >
                長いテキストのテスト
            </h3>
            <p
                style="margin-bottom: var(--size-4-4); color: var(--text-muted); font-size: 0.9em;"
            >
                テキストエリアに長いテキストを入力して、リサイズ機能をテストしてください。
            </p>
            <InlineWriteForm
                handlePost={fn(async (postData) => {
                    console.log("投稿データ:", postData);
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                })}
                onCancel={fn()}
                isSubmitting={false}
            />
        </div>
    </CenterDecorator>
</Story>

<!-- エラーハンドリングのテスト -->
<Story name="Error Handling">
    <CenterDecorator padding="var(--size-4-4)" minHeight="var(--size-4-50)">
        <div style="width: 100%; max-width: 600px;">
            <h3
                style="margin-bottom: var(--size-4-4); color: var(--text-normal);"
            >
                エラーハンドリングテスト
            </h3>
            <p
                style="margin-bottom: var(--size-4-4); color: var(--text-muted); font-size: 0.9em;"
            >
                投稿時に必ずエラーが発生します。エラーハンドリングの動作を確認できます。
            </p>
            <InlineWriteForm
                handlePost={async (postData) => {
                    console.log("投稿データ:", postData);
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    throw new Error("テスト用のエラーです");
                }}
                onCancel={() => {
                    console.log("キャンセルされました");
                }}
                isSubmitting={false}
            />
        </div>
    </CenterDecorator>
</Story>
