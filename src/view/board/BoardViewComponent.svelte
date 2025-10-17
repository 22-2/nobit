<script lang="ts">
	import BaseViewComponent from "../BaseViewComponent.svelte";
	import { getContext, onMount } from "svelte";
	import { BoardManager } from "../../managers/BoardManager.svelte";
	import ThreadListTable from "./ThreadListTable.svelte";
	import type { SorterState, SubjectItem } from "src/lib/types";

	// Props
	interface Props {
		initialUrl?: string;
		onTitleChange?: (title: string) => void;
	}
	let { initialUrl, onTitleChange }: Props = $props();

	// Get BoardManager from context (injected by BoardView ItemView)
	const boardManager = getContext<BoardManager>("boardManager");

	console.log(
		"🔥 BoardViewComponent: Script loaded, boardManager:",
		boardManager,
	);
	console.log("🔥 BoardViewComponent: initialUrl:", initialUrl);

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
			console.log(
				"🔥 BoardViewComponent: Starting to load board:",
				initialUrl,
			);
			try {
				if (!initialUrl) {
					return;
				}
				await boardManager.loadBoard(initialUrl);
				console.log("🔥 BoardViewComponent: Board loaded successfully");
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
		console.log("Sort changed:", newState);
	}

	type ThreadItem = SubjectItem & { index: number };

	async function handleOpenThread(thread: ThreadItem, e: MouseEvent) {
		console.log("Open thread:", thread);
		await boardManager.openThread(thread);
	}

	function handleContextMenu(thread: ThreadItem, e: MouseEvent) {
		console.log("Context menu:", thread);
		// TODO: Implement context menu logic
	}

	function handleHeaderContextMenu(e: MouseEvent) {
		console.log("Header context menu");
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
		<div class="board-header">
			<h2 class="board-title">{boardManager.boardTitle || "板"}</h2>
		</div>

		<ThreadListTable
			threads={boardManager.threads}
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

	.board-header {
		border-bottom: 1px solid var(--background-modifier-border);
		padding-bottom: 0.5rem;
		flex-shrink: 0;
	}

	.board-title {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text-normal);
	}
</style>
