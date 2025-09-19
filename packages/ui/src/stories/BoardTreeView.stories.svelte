<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import BoardTreeView from "../view/BoardTreeView.svelte";
    import CenterDecorator from "./helpers/CenterDecorator.svelte";
    import { fn } from "storybook/test";

    // サンプルデータの生成
    const generateSampleBBSMenus = () => {
        return [
            {
                url: "https://menu.2ch.net/bbsmenu.html",
                menu: [
                    {
                        name: "ニュース",
                        boards: [
                            {
                                name: "ニュー速(嫌儲)",
                                url: "https://greta.5ch.net/poverty/",
                            },
                            {
                                name: "ニュー速VIP",
                                url: "https://hebi.5ch.net/news4vip/",
                            },
                            {
                                name: "なんでも実況J",
                                url: "https://eagle.5ch.net/livejupiter/",
                            },
                        ],
                    },
                    {
                        name: "雑談系2",
                        boards: [
                            {
                                name: "ニュー速(嫌儲)",
                                url: "https://greta.5ch.net/poverty/",
                            },
                            {
                                name: "モ娘(狼)",
                                url: "https://rosie.5ch.net/morningcoffee/",
                            },
                        ],
                    },
                    {
                        name: "学問・文系",
                        boards: [
                            {
                                name: "哲学",
                                url: "https://academy6.5ch.net/philo/",
                            },
                            {
                                name: "文学",
                                url: "https://academy6.5ch.net/book/",
                            },
                            {
                                name: "言語学",
                                url: "https://academy6.5ch.net/gengo/",
                            },
                        ],
                    },
                ],
            },
            {
                url: "https://menu.bbspink.com/bbsmenu.html",
                menu: [
                    {
                        name: "PINKちゃんねる",
                        boards: [
                            {
                                name: "半角二次元",
                                url: "https://mercury.bbspink.com/ascii2d/",
                            },
                            {
                                name: "エロゲー",
                                url: "https://mercury.bbspink.com/hgame/",
                            },
                        ],
                    },
                ],
            },
        ];
    };

    const generateLargeBBSMenus = () => {
        const categories = [
            "ニュース",
            "雑談系2",
            "学問・文系",
            "学問・理系",
            "一般",
            "政治経済",
            "生活",
            "ネタ雑談",
            "カテゴリ雑談",
            "実況ch",
            "受験・学校",
            "趣味",
            "スポーツ一般",
            "球技",
            "格闘技",
            "旅行・外出",
            "テレビ等",
            "芸能",
            "ギャンブル",
            "ゲーム",
            "携帯型ゲーム",
            "ネットゲーム",
            "漫画・小説等",
            "音楽",
            "心と身体",
            "PC等",
            "ネット関係",
            "雑談系22",
            "会社・職業",
        ];

        return [
            {
                url: "https://menu.2ch.net/bbsmenu.html",
                menu: categories.map((categoryName) => ({
                    name: categoryName,
                    boards: Array.from(
                        { length: Math.floor(Math.random() * 10) + 3 },
                        (_, i) => ({
                            name: `${categoryName}板${i + 1}`,
                            url: `https://example.5ch.net/${categoryName.toLowerCase()}${i + 1}/`,
                        })
                    ),
                })),
            },
        ];
    };

    const { Story } = defineMeta({
        title: "View/BoardTreeView",
        component: BoardTreeView,
        tags: ["autodocs"],
        argTypes: {
            getBBSMenus: {
                control: false,
                description: "BBS メニューを取得する非同期関数",
            },
            openBoardView: {
                action: "openBoardView",
                description: "板を開く時のコールバック",
            },
        },
        decorators: [
            (StoryComponent) => ({
                Component: CenterDecorator,
                props: {
                    children: StoryComponent,
                    padding: "0",
                    minHeight: "var(--size-4-125)" /* 500px相当 */,
                    maxWidth: "var(--size-4-75)" /* 300px相当 */,
                },
            }),
        ],
    });
</script>

<!-- デフォルトの状態 -->
<Story
    name="Default"
    args={{
        getBBSMenus: async () => {
            // 実際のローディング時間をシミュレート
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return generateSampleBBSMenus();
        },
        openBoardView: fn(),
    }}
/>

<!-- 即座にロード -->
<Story
    name="Loaded"
    args={{
        getBBSMenus: async () => generateSampleBBSMenus(),
        openBoardView: fn(),
    }}
/>

<!-- ローディング状態 -->
<Story
    name="Loading"
    args={{
        getBBSMenus: async () => {
            // 永続的にローディング状態を保つ
            await new Promise(() => {});
            return [];
        },
        openBoardView: fn(),
    }}
/>

<!-- エラー状態 -->
<Story
    name="Error"
    args={{
        getBBSMenus: async () => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            throw new Error(
                "ネットワークエラー: BBSメニューの取得に失敗しました"
            );
        },
        openBoardView: fn(),
    }}
/>

<!-- 空のデータ -->
<Story
    name="Empty"
    args={{
        getBBSMenus: async () => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            return [];
        },
        openBoardView: fn(),
    }}
/>

<!-- 単一のBBSメニューソース -->
<Story
    name="Single Source"
    args={{
        getBBSMenus: async () => [
            {
                url: "https://menu.2ch.net/bbsmenu.html",
                menu: [
                    {
                        name: "ニュース",
                        boards: [
                            {
                                name: "ニュー速(嫌儲)",
                                url: "https://greta.5ch.net/poverty/",
                            },
                            {
                                name: "ニュー速VIP",
                                url: "https://hebi.5ch.net/news4vip/",
                            },
                        ],
                    },
                ],
            },
        ],
        openBoardView: fn(),
    }}
/>

<!-- 大量のデータ -->
<Story
    name="Large Dataset"
    args={{
        getBBSMenus: async () => {
            await new Promise((resolve) => setTimeout(resolve, 800));
            return generateLargeBBSMenus();
        },
        openBoardView: fn(),
    }}
/>

<!-- 長い名前のテスト -->
<Story
    name="Long Names"
    args={{
        getBBSMenus: async () => [
            {
                url: "https://very-long-domain-name-for-testing-text-overflow.example.com/bbsmenu.html",
                menu: [
                    {
                        name: "非常に長いカテゴリ名のテストケースです",
                        boards: [
                            {
                                name: "これは非常に長い板の名前でテキストオーバーフローの動作を確認するためのものです",
                                url: "https://example.com/very-long-board-name/",
                            },
                            {
                                name: "短い名前",
                                url: "https://example.com/short/",
                            },
                        ],
                    },
                    {
                        name: "普通の長さ",
                        boards: [
                            {
                                name: "Another extremely long board name that should be truncated",
                                url: "https://example.com/long/",
                            },
                        ],
                    },
                ],
            },
        ],
        openBoardView: fn(),
    }}
/>

<!-- 複数のBBSメニューソース -->
<Story
    name="Multiple Sources"
    args={{
        getBBSMenus: async () => [
            {
                url: "https://menu.2ch.net/bbsmenu.html",
                menu: [
                    {
                        name: "ニュース",
                        boards: [
                            {
                                name: "ニュー速(嫌儲)",
                                url: "https://greta.5ch.net/poverty/",
                            },
                            {
                                name: "ニュー速VIP",
                                url: "https://hebi.5ch.net/news4vip/",
                            },
                        ],
                    },
                ],
            },
            {
                url: "https://menu.bbspink.com/bbsmenu.html",
                menu: [
                    {
                        name: "PINKちゃんねる",
                        boards: [
                            {
                                name: "半角二次元",
                                url: "https://mercury.bbspink.com/ascii2d/",
                            },
                        ],
                    },
                ],
            },
            {
                url: "https://menu.shitaraba.net/bbsmenu.html",
                menu: [
                    {
                        name: "したらば掲示板",
                        boards: [
                            {
                                name: "ニュース議論",
                                url: "https://jbbs.shitaraba.net/news/",
                            },
                        ],
                    },
                ],
            },
        ],
        openBoardView: fn(),
    }}
/>

<!-- 遅いネットワーク -->
<Story
    name="Slow Network"
    args={{
        getBBSMenus: async () => {
            // 3秒の遅延をシミュレート
            await new Promise((resolve) => setTimeout(resolve, 3000));
            return generateSampleBBSMenus();
        },
        openBoardView: fn(),
    }}
/>
