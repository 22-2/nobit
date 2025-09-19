<script lang="ts">
    // Import obsidian styles only within this component's scope
    import "../obsidian-app.css";
    import "../obsidian-variables.css";
</script>

<div class="obsidian-app-container">
    <slot />
</div>

<style>
    .obsidian-app-container {
        /* Ensure obsidian styles are contained within this component */
        isolation: isolate;
        contain: style;

        /* Apply obsidian theme variables */
        color-scheme: dark;

        /* Reset any potential conflicts */
        all: initial;
        font-family: var(
            --font-interface,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif
        );
        color: var(--text-normal, #dcddde);
        background: var(--background-primary, #2f3136);
    }

    /* Re-apply necessary global styles within container */
    .obsidian-app-container * {
        box-sizing: border-box;
    }
</style>
