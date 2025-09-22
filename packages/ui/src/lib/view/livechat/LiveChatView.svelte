<!-- src/lib/components/chat/LiveChatView.svelte -->
<script lang="ts">
    import type { Post } from "../../types";
    import { tick } from "svelte";
    import ChatPostList from "./ChatPostList.svelte";
    import ScrollToBottomButton from "./ScrollToBottomButton.svelte";
    import PlaybackControl from "./PlaybackControl.svelte";

    type ControlState = { isPlaying: boolean };

    let {
        initialPosts,
        initialControlState,
        initialReloadInterval,
        onToggleAutoReload,
        onIntervalChange,
    } = $props<{
        // $props() を使用
        initialPosts: Post[];
        initialControlState: ControlState;
        initialReloadInterval: number; // ms
        onToggleAutoReload: () => void;
        onIntervalChange: (interval: number) => void; // ms
    }>();

    let posts = $state<Post[]>(initialPosts);
    let controlState = $state(initialControlState);
    let reloadInterval = $state(initialReloadInterval); // ms

    // 子コンポーネントと連携するための状態
    let userHasScrolledUp = $state(false);
    let chatPostListRef: ChatPostList | undefined = $state();

    let previousIsPlaying = controlState.isPlaying;
    $effect(() => {
        // isPlayingの状態が変化したときに親に通知する
        if (controlState.isPlaying !== previousIsPlaying) {
            onToggleAutoReload?.();
            previousIsPlaying = controlState.isPlaying;
        }
    });

    function handleIntervalChange(seconds: number) {
        const newIntervalMs = seconds * 1000;
        reloadInterval = newIntervalMs;
        onIntervalChange(newIntervalMs);
    }

    function scrollToBottom() {
        chatPostListRef?.scrollToBottom();
    }

    // --- Public API ---
    export function addNewPost(newPost: Post) {
        // chatPostListRef?.containerEl に直接アクセスする代わりに、
        // scrollToBottom 関数がスクロール位置を調整するように変更します。
        // ここでは、新しい投稿を追加する前にスクロール位置を判断し、
        // 投稿後に必要に応じて scrollToBottom を呼び出すロジックを維持します。

        // 新しい投稿が追加される直前に一番下までスクロールされていたかを確認
        // このロジックは chatPostListRef の内部に移すか、
        // userHasScrolledUp の状態に依存させる方が適切です。
        // 今回は、既存のロジックに合わせて、chatPostListRef.imports.containerEl
        // を使用する部分を修正します。
        const containerEl = chatPostListRef?.imports?.containerEl;
        let scrollWasAtBottomBeforeAdd = false;
        if (containerEl) {
            scrollWasAtBottomBeforeAdd =
                containerEl.scrollHeight -
                    containerEl.scrollTop -
                    containerEl.clientHeight <
                10;
        }

        posts = [...posts, newPost];

        // 自動再生中で、ユーザーが手動でスクロールアップしていない場合 (または直前まで一番下にいた場合) に自動スクロール
        if (
            controlState.isPlaying &&
            (!userHasScrolledUp || scrollWasAtBottomBeforeAdd)
        ) {
            tick().then(() => chatPostListRef?.scrollToBottom());
        }
    }

    export function updateControlState(newState: ControlState) {
        controlState.isPlaying = newState.isPlaying;
    }
</script>

<div class="live-chat-view-wrapper">
    <div class="live-chat-content-area">
        <ChatPostList
            bind:this={chatPostListRef}
            {posts}
            {userHasScrolledUp}
            onUserHasScrolledUpChange={(v) => (userHasScrolledUp = v)}
        />

        {#if userHasScrolledUp}
            <ScrollToBottomButton onclick={scrollToBottom} />
        {/if}

        <PlaybackControl
            bind:isPlaying={controlState.isPlaying}
            interval={reloadInterval / 1000}
            onIntervalChange={handleIntervalChange}
        />
    </div>
</div>

<style>
    .live-chat-view-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    }
    .live-chat-content-area {
        position: relative;
        flex-grow: 1;
        overflow: hidden;
    }
</style>
