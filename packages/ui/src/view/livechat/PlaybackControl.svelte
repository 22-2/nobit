<!-- src/lib/components/chat/PlaybackControl.svelte -->
<script lang="ts">
    import { Play, Pause } from "@lucide/svelte";

    // 親からイベントハンドラを直接受け取る
    type Props = {
        onIntervalChange: ((ms: number) => void) | undefined;
        isPlaying: boolean;
        interval: number;
        // Storybookでのテストを容易にするために追加
        // 外部からshowPopupの状態を制御できるようにします。
        // デフォルトでは undefined で、内部で制御します。
        // Storybook側で bind:showPopup={true} とすることで、強制的に表示状態にできます。
        showPopup?: boolean;
    };

    let {
        isPlaying = $bindable(),
        interval,
        onIntervalChange,
        showPopup,
    }: Props = $props();

    // showPopupがpropsで渡された場合はそれを使用し、そうでなければ内部で状態を管理
    let _showPopup = $state(false);
    let hidePopupTimer: NodeJS.Timeout | null = null;

    // props.showPopup が定義されている場合はそちらを優先
    const effectiveShowPopup = $derived(() => showPopup ?? _showPopup);

    function handleIntervalChange(e: Event) {
        const target = e.currentTarget as HTMLSelectElement;
        onIntervalChange?.(Number(target.value));
    }

    function handleMouseEnter() {
        if (hidePopupTimer) clearTimeout(hidePopupTimer);
        _showPopup = true; // 内部状態を更新
    }

    function handleMouseLeave() {
        hidePopupTimer = setTimeout(() => {
            _showPopup = false; // 内部状態を更新
        }, 300);
    }
</script>

<div
    class="playback-control-wrapper"
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
>
    <button
        class="clickable-icon"
        class:is-active={isPlaying}
        onclick={() => (isPlaying = !isPlaying)}
        aria-label={isPlaying ? "自動更新を停止" : "自動更新を開始"}
    >
        {#if isPlaying}
            <Pause size={20} />
        {:else}
            <Play size={20} />
        {/if}
    </button>

    {#if effectiveShowPopup() && isPlaying}
        <div class="playback-settings-popup">
            読み込み間隔
            <select value={String(interval)} onchange={handleIntervalChange}>
                <option value="5">早い (5秒)</option>
                <option value="10">ふつう (10秒)</option>
                <option value="30">ゆっくり (30秒)</option>
            </select>
        </div>
    {/if}
</div>

<style>
    .playback-control-wrapper {
        position: absolute;
        bottom: 1rem;
        right: 1rem;
        z-index: 20;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .playback-control-wrapper .clickable-icon {
        background-color: var(--nobit-background-secondary);
        border-radius: 50%;
        width: var(--nobit-size-4-9);
        height: var(--nobit-size-4-9);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--nobit-shadow-s);
        border: 1px solid var(--nobit-background-modifier-border);
        transition: background-color 0.2s;
    }
    .playback-control-wrapper .clickable-icon:hover {
        background-color: var(--nobit-background-modifier-hover);
    }
    .playback-control-wrapper .clickable-icon.is-active {
        color: var(--nobit-interactive-accent);
    }
    .playback-settings-popup {
        position: absolute;
        bottom: calc(100% + 8px);
        right: 0;
        background-color: var(--nobit-background-secondary);
        border: 1px solid var(--nobit-background-modifier-border);
        border-radius: var(--nobit-radius-m);
        padding: 0.5em 0.8em;
        box-shadow: var(--nobit-shadow-l);
        display: flex;
        align-items: center;
        gap: 0.8em;
        z-index: 100;
        width: max-content;
    }
</style>
