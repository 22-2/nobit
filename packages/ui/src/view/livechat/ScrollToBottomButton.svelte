<!-- src/lib/components/chat/ScrollToBottomButton.svelte -->
<script lang="ts">
    type Props = {
        onclick: (() => void) | undefined;
    };
    let { onclick }: Props = $props();
</script>

<button class="scroll-to-bottom-button" {onclick}> ↓ 新しいレスを表示 </button>

<style>
    .scroll-to-bottom-button {
        position: absolute;
        bottom: 1em;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--interactive-accent);
        color: var(--text-on-accent);
        border: none;
        border-radius: var(--radius-l);
        padding: 0.5em 1em;
        cursor: pointer;
        box-shadow: var(--shadow-s);
        z-index: 10;
        animation: fade-in 0.3s ease;
    }

    @keyframes fade-in {
        from {
            opacity: 0;
            transform: translate(-50%, 10px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
</style>
