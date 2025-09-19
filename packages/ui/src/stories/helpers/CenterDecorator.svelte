<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        children: Snippet;
        padding?: string;
        minHeight?: string;
        backgroundColor?: string;
        borderRadius?: string;
    }

    let {
        children,
        padding = "2rem",
        minHeight = "100px",
        backgroundColor,
        borderRadius,
    }: Props = $props();
</script>

<div
    class="center-decorator"
    style="
        display: flex;
        align-items: center;
        justify-content: center;
        padding: {padding};
        min-height: {minHeight};
        {backgroundColor ? `background-color: ${backgroundColor};` : ''}
        {borderRadius ? `border-radius: ${borderRadius};` : ''}
    "
>
    {@render children()}
</div>

<style>
    .center-decorator {
        box-sizing: border-box;
    }
</style>
