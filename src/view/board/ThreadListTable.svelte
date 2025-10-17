<script lang="ts">
	import LoadingOverlay from "src/components/LoadingOverlay.svelte";
	import WheelProgressIndicator from "src/components/WheelProgressIndicator.svelte";
	import { calculateIkioi } from "src/lib/libch/utils";
	import type { SorterState, SubjectItem } from "src/lib/types";
	import { useSorter } from "src/store/useSorter.svelte";
	import { useWheelRefresh } from "src/store/useWheelRefresh.svelte";
	import ThreadTableBody from "./ThreadTableBody.svelte";
	import ThreadTableHeader from "./ThreadTableHeader.svelte";

	type ThreadItem = SubjectItem & { index: number };

	type Props = {
		threads: SubjectItem[];
		visibleColumns: Record<string, boolean>;
		initialSortState: SorterState;
		isLoading: boolean;
		onSortChange: (newState: SorterState) => void;
		onRefresh: () => Promise<void>;
		openThread: (thread: ThreadItem, e: MouseEvent) => void;
		onContextMenu: (thread: ThreadItem, e: MouseEvent) => void;
		openHeaderContextMenu: (e: MouseEvent) => void;
	};

	let {
		threads,
		visibleColumns,
		initialSortState,
		isLoading,
		onSortChange,
		onRefresh,
		openThread,
		onContextMenu,
		openHeaderContextMenu,
	}: Props = $props();

	let tableContainerEl: HTMLDivElement | undefined = $state();

	const wheelRefresh = useWheelRefresh({
		getScrollElement: () => tableContainerEl,
		isEnabled: () => !isLoading, // ローディング中は無効化
		up: {
			onRefresh,
		},
	});

	// isRefreshing は wheelRefresh の内部状態に連動させる
	const isRefreshing = $derived(
		wheelRefresh.wheelState.status === "refreshing",
	);

	// 外部からの isLoading と、ホイールリフレッシュ起因の isRefreshing の両方を考慮してローディング状態を決定する。
	// これにより、リフレッシュが開始された瞬間に確実かつ即座にローディング画面が表示される。
	const shouldShowLoading = $derived(isLoading || isRefreshing);

	// Derived state & sorting logic
	const indexedThreads = $derived(threads.map((t, index) => ({ ...t, index: index + 1 })));

	const sorter = useSorter(
		() => indexedThreads,
		{
			index: { compare: (a, b) => a.index - b.index },
			title: { compare: (a, b) => a.title.localeCompare(b.title) },
			resCount: {
				compare: (a, b) => a.resCount - b.resCount,
				defaultDirection: "desc",
			},
			ikioi: {
				compare: (a, b) => calculateIkioi(a) - calculateIkioi(b),
				defaultDirection: "desc",
			},
		},
		initialSortState,
		onSortChange,
	);
</script>

<div class="table-wrapper">
	<WheelProgressIndicator wheelState={wheelRefresh.wheelState} position="top" />

	{#if shouldShowLoading}
		<!--
          データがある場合（リフレッシュ時）は背景が透けるオーバーレイ(transparent)
          データがない場合（初回ロード時）は背景をしっかり覆うオーバーレイ
        -->
		<LoadingOverlay />
	{/if}

	<div class="thread-table" role="table">
		<ThreadTableHeader
			{visibleColumns}
			sortKey={sorter.sortKey}
			sortDirection={sorter.sortDirection}
			onSort={sorter.setSort}
			onContextMenu={openHeaderContextMenu}
		/>

		<ThreadTableBody
			threads={sorter.sortedItems()}
			{visibleColumns}
			onThreadClick={openThread}
			{onContextMenu}
			bind:containerEl={tableContainerEl}
		/>
	</div>
</div>

<style>
	.table-wrapper {
		position: relative;
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		overflow: hidden;
	}

	.thread-table {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		overflow: hidden;
	}
</style>
