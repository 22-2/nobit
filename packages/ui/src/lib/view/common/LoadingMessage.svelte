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
        color: var(--nobit-text-muted);
        padding: 1em;
    }

    .error-message {
        color: var(--nobit-text-error);
    }
</style>
