<script lang="ts">
	import WheelProgressIndicator from "src/components/WheelProgressIndicator.svelte";
	import { useWheelRefresh } from "src/store/useWheelRefresh.svelte";
	import { getContext, onMount } from "svelte";
	import { ThreadManager } from "../../managers/ThreadManager.svelte";
	import type { UsePopoverReturn } from "../../store/usePopover.svelte";
	import BaseViewComponent from "../BaseViewComponent.svelte";
	import PostItem from "./PostItem.svelte";
	import ThreadFiltersComponent from "./ThreadFilters.svelte";
	import ThreadToolbar from "./ThreadToolbar.svelte";

	// Props
	interface Props {
		initialUrl?: string;
		onTitleChange?: (title: string) => void;
	}
	let { initialUrl, onTitleChange }: Props = $props();

	// Get ThreadManager and popoverService from context (injected by ThreadView ItemView)
	const threadManager = getContext<ThreadManager>("threadManager");
	const popoverService = getContext<UsePopoverReturn>("popoverService");

	console.log(
		"🔥 ThreadViewComponent: Script loaded, threadManager:",
		threadManager,
	);
	console.log("🔥 ThreadViewComponent: popoverService:", popoverService);
	console.log("🔥 ThreadViewComponent: initialUrl:", initialUrl);

	// Debug: Watch filters changes
	$effect(() => {
		console.log(
			"🔍 Filters changed:",
			JSON.stringify(threadManager.filters),
		);
		console.log(
			"🔍 Filtered posts count:",
			threadManager.filteredPosts.length,
		);
	});

	// Watch thread title changes and notify parent
	$effect(() => {
		const title = threadManager.thread?.title;
		if (title && onTitleChange) {
			onTitleChange(title);
		}
	});

	let threadContentEl = $state<HTMLElement>();
	let popoverContainerEl = $state<HTMLElement>();

	// Setup wheel refresh for down direction
	const { wheelState, bindRefreshTriggerLine } = useWheelRefresh({
		getScrollElement: () => threadContentEl,
		isEnabled: () => {
			console.log("threadManager.isLoading", threadManager.isLoading);
			return !threadManager.isLoading;
		},
		down: {
			onRefresh: async () => {
				await threadManager.refreshThread();
			},
			gap: -200,
			threshold: 7,
		},
	});

	// isRefreshing は wheelState の内部状態に連動させる
	const isRefreshing = $derived(wheelState.status === "refreshing");

	// 外部からの isLoading と、ホイールリフレッシュ起因の isRefreshing の両方を考慮してローディング状態を決定する
	const shouldShowLoading = $derived(threadManager.isLoading || isRefreshing);

	// Update popoverService with thread data when thread changes
	$effect(() => {
		if (threadManager.thread) {
			popoverService.setThreadData(threadManager.thread);
		}
	});

	onMount(() => {
		// Initialize popover container
		if (popoverContainerEl) {
			popoverService.init(popoverContainerEl);
		}

		// Load thread
		(async () => {
			console.log(
				"🔥 ThreadViewComponent: Starting to load thread:",
				initialUrl,
			);
			try {
				if (!initialUrl) {
					return;
				}
				await threadManager.loadThread(initialUrl);
				console.log(
					"🔥 ThreadViewComponent: Thread loaded successfully",
				);
			} catch (error) {
				console.error(
					"🔥 ThreadViewComponent: Failed to load thread:",
					error,
				);
			}
		})();

		let scrollVelocity = 0;
		let animationFrameId: number | null = null;

		// Custom smooth scroll animation
		const smoothScroll = () => {
			if (!threadContentEl) return;

			if (Math.abs(scrollVelocity) > 0.1) {
				threadContentEl.scrollTop += scrollVelocity;
				scrollVelocity *= 0.85; // Damping factor (higher = slower deceleration)
				animationFrameId = requestAnimationFrame(smoothScroll);
			} else {
				scrollVelocity = 0;
				animationFrameId = null;
			}
		};

		// Increase scroll amount for mouse wheel
		const handleWheel = (e: Event) => {
			if (!(e instanceof WheelEvent)) return;

			// Check if the wheel event is happening over our component

			const target = (e.target as HTMLElement).closest(".thread-content");
			if (
				!threadContentEl?.contains(target) &&
				threadContentEl !== target
			)
				return;

			e.preventDefault();
			e.stopPropagation();

			const delta = e.deltaY;
			const multiplier = 4;

			// Add to velocity instead of direct scroll
			scrollVelocity += delta * multiplier * 0.1;

			// Start animation if not already running
			if (!animationFrameId) {
				animationFrameId = requestAnimationFrame(smoothScroll);
			}
		};

		const timer = setTimeout(() => {
			console.log("🎯 Adding wheel listener to window");
			window.addEventListener("wheel", handleWheel, { passive: false });
		}, 100);

		return () => {
			clearTimeout(timer);
			window.removeEventListener("wheel", handleWheel);
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	});

	// Event handlers that delegate to ThreadManager
	function handleRefresh() {
		threadManager.refreshThread();
	}

	function handleJumpToPost(resNumber: number) {
		threadManager.jumpToPost(resNumber);
	}

	function handleHoverPostLink(detail: {
		targetEl: HTMLElement;
		index: number;
		event: MouseEvent;
	}) {
		popoverService.handleHover(
			detail.targetEl,
			detail.index,
			0,
			detail.event,
		);
	}

	function handleLeavePostLink() {
		popoverService.startHideTimer();
	}

	function handleShowReplyTree(detail: {
		targetEl: HTMLElement;
		originResNumber: number;
		event: MouseEvent;
	}) {
		popoverService.handleShowReplyTree(
			detail.targetEl,
			detail.originResNumber,
			0,
			detail.event,
		);
	}

	function handleShowIdPosts(detail: {
		targetEl: HTMLElement;
		post: import("src/lib/types").Post;
		siblingPostNumbers: number[];
		event: MouseEvent;
	}) {
		popoverService.handleShowIdPosts(
			detail.targetEl,
			detail.post,
			0,
			detail.event,
		);
	}
</script>

<BaseViewComponent
	error={threadManager.error}
	onRetry={handleRefresh}
	class="thread-view"
>
	<!-- Wheel Progress Indicator -->
	<WheelProgressIndicator {wheelState} position="bottom" />

	<!-- Popover container -->
	<div class="popover-container" bind:this={popoverContainerEl}></div>
	<!-- Thread Filters Component -->
	<div class="filters-section">
		<ThreadFiltersComponent
			bind:filters={threadManager.filters}
			isVisible={true}
		/>
	</div>

	<!-- Loading State -->
	{#if threadManager.thread}
		<!-- Thread Content -->
		<div class="thread-content" bind:this={threadContentEl}>
			<div class="thread-header">
				<h2 class="thread-title">{threadManager.thread.title}</h2>
				<div class="thread-info">
					<span class="post-count"
						>{threadManager.filteredPosts.length} / {threadManager
							.thread.posts.length} posts</span
					>
				</div>
			</div>

			<div class="posts-container">
				{#each threadManager.filteredPosts as post}
					<PostItem
						{post}
						index={post.resNum - 1}
						onJumpToPost={handleJumpToPost}
						onHoverPostLink={handleHoverPostLink}
						onLeavePostLink={handleLeavePostLink}
						onShowReplyTree={handleShowReplyTree}
						onShowIdPosts={handleShowIdPosts}
					/>
				{/each}
			</div>
			<!-- Refresh trigger line for down direction -->
			<div class="refresh-trigger-line" use:bindRefreshTriggerLine></div>
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
			isLoading={shouldShowLoading}
		/>
	</div>
</BaseViewComponent>

<style>
	.thread-view {
		display: block !important;
		height: 100%;
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

	.thread-content {
		height: 100%;
		overflow-y: scroll;
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

	.popover-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 1000;
	}

	.popover-container :global(*) {
		pointer-events: auto;
	}

	.refresh-trigger-line {
		width: 100%;
		height: 1px;
		background-color: transparent;
		pointer-events: none;
	}
</style>
