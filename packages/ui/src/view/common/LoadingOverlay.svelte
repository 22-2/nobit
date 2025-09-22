<!-- E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\view\common\LoadingOverlay.svelte -->
<script lang="ts">
    import { fade } from "svelte/transition";

    let { transparent = false } = $props<{ transparent?: boolean }>();
</script>

<div
    class:loading-overlay-transparent={transparent}
    class:loading-overlay={!transparent}
    transition:fade={{ duration: 150 }}
/>

<style>
    .loading-overlay,
    .loading-overlay-transparent {
        position: absolute;
        inset: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
        backdrop-filter: blur(1px);
    }
    .loading-overlay {
        /* データがない時の初期ロード用 */
        background-color: var(--nobit-background-overlay);
    }
    .loading-overlay-transparent {
        /* データがある時のリフレッシュ用 */
        background-color: var(--nobit-background-overlay);
        opacity: 0.8;
    }
</style>
