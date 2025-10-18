<script lang="ts">
	import type { Snippet } from "svelte";

	// Props
	interface Props {
		/**
		 * エラーメッセージ
		 */
		error?: string | null;
		/**
		 * エラー時の再試行ハンドラ
		 */
		onRetry?: () => void;
		/**
		 * ルートのCSSクラス名
		 */
		class?: string;
		/**
		 * コンテンツスニペット
		 */
		children?: Snippet;
	}

	let { error, onRetry, class: className = "", children }: Props = $props();
</script>

<div class="base-view {className}">
	{#if error}
		<!-- Error State -->
		<div class="error-container">
			<div class="error-icon">⚠️</div>
			<div class="error-message">{error}</div>
			{#if onRetry}
				<button class="retry-button" onclick={onRetry}> 再試行 </button>
			{/if}
		</div>
	{:else}
		<!-- Content Snippet -->
		{#if children}
			{@render children()}
		{/if}
	{/if}
</div>

<style>
	.base-view {
		height: 100%;
	}

	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 1rem;
		background: var(--background-modifier-error);
		border-radius: 0.5rem;
		border: 1px solid var(--background-modifier-border);
	}

	.error-icon {
		font-size: 2rem;
	}

	.error-message {
		color: var(--text-error);
		text-align: center;
		font-weight: 500;
	}

	.retry-button {
		padding: 0.5rem 1rem;
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.retry-button:hover {
		background: var(--interactive-accent-hover);
	}
</style>
