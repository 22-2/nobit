<script lang="ts">
	import { onMount } from "svelte";

	// Simple test without ThreadManager
	let isLoading = true;
	let error: string | null = null;
	let thread: any = null;

	onMount(async () => {
		// Simulate loading
		setTimeout(() => {
			isLoading = false;
			thread = {
				title: "Test Thread",
				posts: [
					{ resNum: 1, content: "Test post 1" },
					{ resNum: 2, content: "Test post 2" }
				]
			};
		}, 1000);
	});
</script>

<div class="thread-view">
	<div class="filters-section">
		<p>Filters would go here</p>
	</div>

	{#if isLoading}
		<div class="loading-container">
			<div class="loading-text">Loading thread...</div>
		</div>
	{:else if error}
		<div class="error-container">
			<div class="error-message">{error}</div>
		</div>
	{:else if thread}
		<div class="thread-content">
			<div class="thread-header">
				<h2 class="thread-title">{thread.title}</h2>
			</div>

			<div class="posts-container">
				{#each thread.posts as post}
					<div class="post-item">
						<span>#{post.resNum}: {post.content}</span>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="empty-container">
			<div class="empty-message">No thread loaded</div>
		</div>
	{/if}

	<div class="toolbar-section">
		<p>Toolbar would go here</p>
	</div>
</div>

<style>
	.thread-view {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1rem;
		gap: 1rem;
	}

	.loading-container, .error-container, .empty-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 1rem;
	}

	.thread-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.thread-header {
		border-bottom: 1px solid var(--background-modifier-border);
		padding-bottom: 1rem;
	}

	.thread-title {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 600;
	}

	.posts-container {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.post-item {
		padding: 0.5rem;
		background: var(--background-secondary);
		border-radius: 0.25rem;
	}
</style>