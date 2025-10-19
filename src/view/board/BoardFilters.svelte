<!-- src/view/board/BoardFilters.svelte -->
<script lang="ts">
	import type { BoardFilters } from "src/lib/types";
	import { Search } from "lucide-svelte";

	let {
		filters = $bindable({
			searchText: "",
		}),
		isVisible = true,
	} = $props<{
		filters: BoardFilters;
		isVisible: boolean;
	}>();

	function onSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		filters = { ...filters, searchText: target.value };
	}
</script>

{#if isVisible}
	<div class="board-filters">
		<div class="search-input-wrapper">
			<Search size={16} class="search-icon" />
			<input
				type="text"
				value={filters.searchText}
				oninput={onSearchInput}
				placeholder="スレタイトルで検索..."
				class="search-input"
			/>
		</div>
	</div>
{/if}

<style>
	.board-filters {
		display: flex;
		align-items: center;
		position: sticky;
		top: -1px;
		z-index: 10;
		background-color: var(--background-primary);
		padding: 0.75em 0;
		margin-bottom: 1em;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.search-input-wrapper {
		display: flex;
		align-items: center;
		background-color: var(--background-secondary);
		border-radius: var(--radius-m);
		padding: 0 8px;
		flex-grow: 1;
		min-width: 150px;
	}

	.search-input-wrapper:focus-within {
		box-shadow: 0 0 0 1px var(--interactive-accent);
	}

	.search-icon {
		color: var(--text-faint);
		margin-right: 6px;
	}

	.search-input {
		width: 100%;
		border: none;
		background-color: transparent;
		padding: 6px 0;
		color: var(--text-normal);
		font-size: 0.9em;
	}

	.search-input:focus {
		outline: none;
		box-shadow: none;
	}
</style>