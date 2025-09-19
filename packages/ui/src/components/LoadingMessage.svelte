<script lang="ts">
    let { message, isError = false } = $props<{
        message: string;
        isError?: boolean;
    }>();
</script>

<p class="status-message" class:error-message={isError}>
    {message}
</p>

<style>
    .status-message {
        color: var(--text-muted);
        padding: 1em;
    }

    .error-message {
        color: var(--text-error);
    }
</style>
