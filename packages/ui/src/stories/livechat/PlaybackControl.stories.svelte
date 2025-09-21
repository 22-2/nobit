<!-- src/stories/livechat/PlaybackControl.stories.svelte -->
<script module lang="ts">
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import PlaybackControl from "../../view/livechat/PlaybackControl.svelte";
    import CenterDecorator from "../helpers/CenterDecorator.svelte";
    import { fn } from "storybook/test";

    const { Story } = defineMeta({
        title: "LiveChat/PlaybackControl",
        component: PlaybackControl,
        tags: ["autodocs"],
        argTypes: {
            onIntervalChange: {
                action: "onintervalchange",
                description:
                    "間隔が変更されたときに呼び出されるコールバック (秒単位)",
            },
            isPlaying: {
                control: "boolean",
                description: "再生中かどうか",
            },
            interval: {
                control: { type: "select", options: [5, 10, 30] },
                description: "自動更新間隔 (秒)",
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

<script lang="ts">
    // インタラクティブテスト用のリアクティブな状態
    let interactiveState = $state({
        isPlaying: true,
        interval: 10,
    });
</script>

<!-- 再生中の状態 -->
<Story
    name="Playing"
    args={{
        isPlaying: true,
        interval: 10,
        onIntervalChange: fn(),
    }}
/>

<!-- 一時停止中の状態 -->
<Story
    name="Paused"
    args={{
        isPlaying: false,
        interval: 10,
        onIntervalChange: fn(),
    }}
/>

<!-- 異なる間隔 (早い) -->
<Story
    name="Playing - Fast Interval"
    args={{
        isPlaying: true,
        interval: 5,
        onIntervalChange: fn(),
    }}
/>

<!-- 異なる間隔 (遅い) -->
<Story
    name="Playing - Slow Interval"
    args={{
        isPlaying: true,
        interval: 30,
        onIntervalChange: fn(),
    }}
/>

<!-- インタラクティブなテスト (Svelte 5/$state を使用) -->
<Story name="Interactive">
    <div
        style="position: relative; width: 200px; height: 100px; display: flex; align-items: flex-end; justify-content: flex-end; border: 1px dashed var(--background-modifier-border);"
    >
        <PlaybackControl
            bind:isPlaying={interactiveState.isPlaying}
            interval={interactiveState.interval}
            onIntervalChange={(newInterval) => {
                interactiveState.interval = newInterval;
                // StorybookのActionsアドオンにログを出力
                fn()("onintervalchange: interval is now " + newInterval);
            }}
        />
    </div>
    <div
        style="margin-top: 20px; font-size: 0.9em; color: var(--text-muted); text-align: center;"
    >
        <p>
            現在の状態: 再生中: {interactiveState.isPlaying
                ? "はい"
                : "いいえ"}, 間隔: {interactiveState.interval}秒
        </p>
        <p>再生/一時停止ボタンをクリックしたり、</p>
        <p>マウスオーバーで表示される設定から間隔を変更してみてください。</p>
    </div>
</Story>
