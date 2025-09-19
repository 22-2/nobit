<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import ThreadFilters from "../components/ThreadFilters.svelte";
    import CenterDecorator from "./helpers/CenterDecorator.svelte";
    import { fn } from "storybook/test";

    // サンプルフィルター状態の生成
    const generateDefaultFilters = () => ({
        popular: false,
        image: false,
        video: false,
        external: false,
        internal: false,
        searchText: "",
    });

    const generateActiveFilters = () => ({
        popular: true,
        image: true,
        video: false,
        external: true,
        internal: false,
        searchText: "検索テキスト",
    });

    const generateAllActiveFilters = () => ({
        popular: true,
        image: true,
        video: true,
        external: true,
        internal: true,
        searchText: "全てのフィルターが有効",
    });

    const { Story } = defineMeta({
        title: "UI/ThreadFilters",
        component: ThreadFilters,
        tags: ["autodocs"],
        argTypes: {
            filters: {
                control: "object",
                description: "フィルターの状態オブジェクト",
            },
            isVisible: {
                control: "boolean",
                description: "フィルターの表示/非表示",
            },
        },
        decorators: [
            (StoryComponent) => ({
                Component: CenterDecorator,
                props: {
                    children: StoryComponent,
                    padding: "var(--size-4-4)",
                    minHeight: "var(--size-4-25)",
                },
            }),
        ],
    });
</script>

<!-- デフォルトの状態 -->
<Story
    name="Default"
    args={{
        filters: generateDefaultFilters(),
        isVisible: true,
    }}
/>

<!-- 一部のフィルターが有効 -->
<Story
    name="Some Active"
    args={{
        filters: generateActiveFilters(),
        isVisible: true,
    }}
/>

<!-- 全てのフィルターが有効 -->
<Story
    name="All Active"
    args={{
        filters: generateAllActiveFilters(),
        isVisible: true,
    }}
/>

<!-- 非表示状態 -->
<Story
    name="Hidden"
    args={{
        filters: generateDefaultFilters(),
        isVisible: false,
    }}
/>

<!-- 検索テキストのみ -->
<Story
    name="Search Only"
    args={{
        filters: {
            ...generateDefaultFilters(),
            searchText: "プログラミング",
        },
        isVisible: true,
    }}
/>

<!-- 長い検索テキスト -->
<Story
    name="Long Search Text"
    args={{
        filters: {
            ...generateDefaultFilters(),
            searchText:
                "これは非常に長い検索テキストの例です。UIがどのように対応するかをテストします。",
        },
        isVisible: true,
    }}
/>

<!-- インタラクティブなテスト -->
<Story name="Interactive Test">
    <CenterDecorator padding="var(--size-4-4)" minHeight="var(--size-4-50)">
        <div style="width: 100%; max-width: 800px;">
            <h3
                style="margin-bottom: var(--size-4-4); color: var(--text-normal);"
            >
                インタラクティブテスト
            </h3>
            <p
                style="margin-bottom: var(--size-4-4); color: var(--text-muted); font-size: 0.9em;"
            >
                フィルターボタンをクリックしたり、検索テキストを入力してみてください。
                コンソールに変更内容が表示されます。
            </p>
            <ThreadFilters
                filters={{
                    popular: false,
                    image: false,
                    video: false,
                    external: false,
                    internal: false,
                    searchText: "",
                }}
                isVisible={true}
            />
            <div
                style="margin-top: var(--size-4-4); padding: var(--size-4-3); background-color: var(--background-secondary); border-radius: var(--radius-s);"
            >
                <p
                    style="color: var(--text-muted); font-size: 0.85em; margin: 0;"
                >
                    注意:
                    このストーリーでは実際のフィルター状態の変更は反映されません。
                    実際の動作確認は統合テストで行ってください。
                </p>
            </div>
        </div>
    </CenterDecorator>
</Story>

<!-- 狭い画面でのテスト -->
<Story name="Narrow Screen">
    <div style="width: 300px; margin: 0 auto; padding: var(--size-4-4);">
        <h3
            style="margin-bottom: var(--size-4-4); color: var(--text-normal); font-size: 1em;"
        >
            狭い画面でのテスト
        </h3>
        <ThreadFilters filters={generateActiveFilters()} isVisible={true} />
    </div>
</Story>

<!-- 各フィルターの個別テスト -->
<Story name="Individual Filters">
    <CenterDecorator padding="var(--size-4-4)" minHeight="var(--size-4-100)">
        <div
            style="width: 100%; max-width: 800px; display: flex; flex-direction: column; gap: var(--size-4-6);"
        >
            <div>
                <h4
                    style="color: var(--text-normal); margin-bottom: var(--size-4-2);"
                >
                    人気フィルターのみ
                </h4>
                <ThreadFilters
                    filters={{
                        popular: true,
                        image: false,
                        video: false,
                        external: false,
                        internal: false,
                        searchText: "",
                    }}
                    isVisible={true}
                />
            </div>

            <div>
                <h4
                    style="color: var(--text-normal); margin-bottom: var(--size-4-2);"
                >
                    画像フィルターのみ
                </h4>
                <ThreadFilters
                    filters={{
                        popular: false,
                        image: true,
                        video: false,
                        external: false,
                        internal: false,
                        searchText: "",
                    }}
                    isVisible={true}
                />
            </div>

            <div>
                <h4
                    style="color: var(--text-normal); margin-bottom: var(--size-4-2);"
                >
                    動画フィルターのみ
                </h4>
                <ThreadFilters
                    filters={{
                        popular: false,
                        image: false,
                        video: true,
                        external: false,
                        internal: false,
                        searchText: "",
                    }}
                    isVisible={true}
                />
            </div>

            <div>
                <h4
                    style="color: var(--text-normal); margin-bottom: var(--size-4-2);"
                >
                    外部・内部フィルター
                </h4>
                <ThreadFilters
                    filters={{
                        popular: false,
                        image: false,
                        video: false,
                        external: true,
                        internal: true,
                        searchText: "",
                    }}
                    isVisible={true}
                />
            </div>
        </div>
    </CenterDecorator>
</Story>
