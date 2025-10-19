<script lang="ts">
	import log from "loglevel";
	import type { SorterState, SubjectItem } from "src/lib/types";
	import { getContext, onMount } from "svelte";
	import { BoardManager } from "../../managers/BoardManager.svelte";
	import BaseViewComponent from "../BaseViewComponent.svelte";
	import BoardFilters from "./BoardFilters.svelte";
	import ThreadListTable from "./ThreadListTable.svelte";

	const logger = log.getLogger("BoardViewComponent");

	// Props
	interface Props {
		initialUrl?: string;
		onTitleChange?: (title: string) => void;
	}
	let { initialUrl, onTitleChange }: Props = $props();

	// Get BoardManager from context (injected by BoardView ItemView)
	const boardManager = getContext<BoardManager>("boardManager");

	logger.debug(
		"🔥 BoardViewComponent: Script loaded, boardManager:",
		boardManager,
	);
	logger.debug("🔥 BoardViewComponent: initialUrl:", initialUrl);

	// Watch board title changes and notify parent
	$effect(() => {
		const title = boardManager.boardTitle;
		if (title && onTitleChange) {
			onTitleChange(title);
		}
	});

	// State for table functionality
	let visibleColumns = $state({
		index: true,
		title: true,
		resCount: true,
		ikioi: true,
	});

	let sortState = $state<SorterState>({
		sortKey: null,
		sortDirection: "asc",
	});

	onMount(() => {
		// Load board
		(async () => {
			logger.debug(
				"🔥 BoardViewComponent: Starting to load board:",
				initialUrl,
			);
			try {
				if (!initialUrl) {
					return;
				}
				await boardManager.loadBoard(initialUrl);
				logger.debug(
					"🔥 BoardViewComponent: Board loaded successfully",
				);
			} catch (error) {
				console.error(
					"🔥 BoardViewComponent: Failed to load board:",
					error,
				);
			}
		})();
	});

	// Event handlers
	async function handleRefresh() {
		await boardManager.refreshBoard();
	}

	function handleSortChange(newState: SorterState) {
		sortState = newState;
		logger.debug("Sort changed:", newState);
	}

	type ThreadItem = SubjectItem & { index: number };

	async function handleOpenThread(thread: ThreadItem, e: MouseEvent) {
		logger.debug("Open thread:", thread);
		await boardManager.openThread(thread);
	}

	function handleContextMenu(thread: ThreadItem, e: MouseEvent) {
		e.preventDefault();
		boardManager.showThreadContextMenu(thread, e);
	}

	function handleHeaderContextMenu(e: MouseEvent) {
		logger.debug("Header context menu");
		// TODO: Implement header context menu logic
	}
</script>

<BaseViewComponent
	error={boardManager.error}
	onRetry={handleRefresh}
	class="board-view"
>
	<!-- Board Content with ThreadListTable -->
	<div class="board-content">
		<!-- <div class="board-header">
			<h2 class="board-title">{boardManager.boardTitle || "板"}</h2>
			<div class="board-info">
				<span class="thread-count"
					>{boardManager.filteredThreads.length} / {boardManager
						.threads.length} threads</span
				>
			</div>
		</div> -->
		<!-- todo: move to status bar -->

		<!-- Board Filters Component -->
		<div class="filters-section">
			<BoardFilters
				bind:filters={boardManager.filters}
				isVisible={boardManager.filterVisible}
			/>
		</div>

		<ThreadListTable
			threads={boardManager.filteredThreads}
			{visibleColumns}
			initialSortState={sortState}
			isLoading={boardManager.isLoading}
			onSortChange={handleSortChange}
			onRefresh={handleRefresh}
			openThread={handleOpenThread}
			onContextMenu={handleContextMenu}
			openHeaderContextMenu={handleHeaderContextMenu}
		/>
	</div>
</BaseViewComponent>

<style>
	.board-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow: hidden;
	}

	.filters-section {
		flex-shrink: 0;
		margin: 0 32px;
	}

	.board-header {
		border-bottom: 1px solid var(--background-modifier-border);
		padding-bottom: 0.5rem;
		flex-shrink: 0;
	}

	.board-title {
		margin: 0 0 0.5rem 0;
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text-normal);
	}

	.board-info {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.thread-count {
		color: var(--text-muted);
		font-size: 0.9rem;
	}
</style>
