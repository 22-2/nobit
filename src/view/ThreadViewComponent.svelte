<script lang="ts">
	import { getContext, onMount } from "svelte";
	import type { ThreadFilters } from "../lib/types";
	import { ThreadManager } from "../managers/ThreadManager.svelte";
	import PostItem from "./thread/PostItem.svelte";
	import ThreadFiltersComponent from "./thread/ThreadFilters.svelte";
	import ThreadToolbar from "./thread/ThreadToolbar.svelte";

	// Props
	interface Props {
		initialUrl?: string;
		onTitleChange?: (title: string) => void;
	}
	let { initialUrl, onTitleChange }: Props = $props();

	// Get ThreadManager from context (injected by ThreadView ItemView)
	const threadManager = getContext<ThreadManager>("threadManager");

	console.log("🔥 ThreadViewComponent: Script loaded, threadManager:", threadManager);
	console.log("🔥 ThreadViewComponent: initialUrl:", initialUrl);

	// Debug: Watch filters changes
	$effect(() => {
		console.log("🔍 Filters changed:", JSON.stringify(threadManager.filters));
		console.log("🔍 Filtered posts count:", threadManager.filteredPosts.length);
	});

	// Watch thread title changes and notify parent
	$effect(() => {
		const title = threadManager.thread?.title;
		if (title && onTitleChange) {
			onTitleChange(title);
		}
	});

	onMount(async () => {
		// Determine which URL to load:
		console.log("🔥 ThreadViewComponent: Starting to load thread:", initialUrl);
		try {
			if (!initialUrl) {
				// throw new Error("No initial URL provided");
				return;
			}
			await threadManager.loadThread(initialUrl);
			console.log("🔥 ThreadViewComponent: Thread loaded successfully");
		} catch (error) {
			console.error("🔥 ThreadViewComponent: Failed to load thread:", error);
		}
	});

	// Event handlers that delegate to ThreadManager
	function handleRefresh() {
		threadManager.refreshThread();
	}

	function handleJumpToPost(resNumber: number) {
		threadManager.jumpToPost(resNumber);
	}

	function handleUpdateFilters(newFilters: Partial<ThreadFilters>) {
		threadManager.updateFilters(newFilters);
	}
</script>

<div class="thread-view">
	<!-- Thread Filters Component -->
	<div class="filters-section">
		<ThreadFiltersComponent
			bind:filters={threadManager.filters}
			isVisible={true}
		/>
	</div>

	<!-- Loading State -->
	{#if threadManager.isLoading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<div class="loading-text">スレッドを読み込み中...</div>
		</div>
	{:else if threadManager.error}
		<!-- Error State -->
		<div class="error-container">
			<div class="error-icon">⚠️</div>
			<div class="error-message">{threadManager.error}</div>
			<button class="retry-button" on:click={handleRefresh}>
				再試行
			</button>
		</div>
	{:else if threadManager.thread}
		<!-- Thread Content -->
		<div class="thread-content">
			<div class="thread-header">
				<h2 class="thread-title">{threadManager.thread.title}</h2>
				<div class="thread-info">
					<span class="post-count"
						>{threadManager.filteredPosts.length} / {threadManager.thread.posts.length} posts</span
					>
				</div>
			</div>

			<div class="posts-container">
				{#each threadManager.filteredPosts as post, index}
					<PostItem
						{post}
						{index}
						onJumpToPost={handleJumpToPost}
					/>
				{/each}
			</div>
		</div>
	{:else}
		<!-- Empty State -->
		<div class="empty-container">
			<div class="empty-icon">📄</div>
			<div class="empty-message">スレッドが読み込まれていません</div>
		</div>
	{/if}

	<!-- Thread Toolbar (always visible) -->
	<div class="toolbar-section">
		<ThreadToolbar
			onRefresh={handleRefresh}
			isLoading={threadManager.isLoading}
		/>
	</div>
</div>

<style>
	.thread-view {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1rem;
		gap: 1rem;
		position: relative;
	}

	.filters-section {
		flex-shrink: 0;
	}

	.toolbar-section {
		flex-shrink: 0;
		margin-top: auto;
		position: fixed;
		bottom: 0px;
		right: 0px;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 1rem;
	}

	.loading-spinner {
		width: 2rem;
		height: 2rem;
		border: 2px solid var(--background-modifier-border);
		border-top: 2px solid var(--interactive-accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.loading-text {
		color: var(--text-muted);
		font-size: 0.9rem;
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
		margin: 0 0 0.5rem 0;
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text-normal);
	}

	.thread-info {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.post-count {
		color: var(--text-muted);
		font-size: 0.9rem;
	}

	.posts-container {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.empty-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 1rem;
		color: var(--text-muted);
	}

	.empty-icon {
		font-size: 2rem;
		opacity: 0.5;
	}

	.empty-message {
		font-size: 0.9rem;
	}
</style>
