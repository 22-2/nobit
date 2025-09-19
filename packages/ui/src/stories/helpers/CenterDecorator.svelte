<script lang="ts">
    import type { Snippet } from "svelte";
    import ObsidianContainer from "./ObsidianContainer.svelte";

    interface Props {
        children: Snippet;
        padding?: string;
        minHeight?: string;
        backgroundColor?: string;
        borderRadius?: string;
    }

    let {
        children,
        padding = "var(--size-4-8)" /* 32px */,
        minHeight = "var(--size-4-25)" /* 100px */,
        backgroundColor,
        borderRadius,
    }: Props = $props();
</script>

<ObsidianContainer>
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
</ObsidianContainer>

<style>
    .center-decorator {
        box-sizing: border-box;
    }
</style>
