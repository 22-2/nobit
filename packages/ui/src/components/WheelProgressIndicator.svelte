<!-- src/components/WheelProgressIndicator.svelte -->
<script lang="ts">
	type Progress = {
		count: number;
		direction: "up" | "down" | null;
		threshold: number;
	};

	let {
		progress,
		isCoolingDown = false,
		isRefreshing = false,
		position = "top",
	} = $props<{
		progress: Progress;
		isCoolingDown?: boolean;
		isRefreshing?: boolean;
		position?: "top" | "bottom";
	}>();
</script>

{#if progress.count > 0 && !isCoolingDown && !isRefreshing}
	<div class="wheel-progress-indicator" class:bottom={position === "bottom"}>
		{progress.direction === "up" ? "↑" : "↓"}
		<span class="progress-bar-wrapper">
			<div
				class="progress-bar"
				style="width: {Math.min(
					(progress.count / progress.threshold) * 100,
					100,
				)}%;"
			></div>
		</span>
	</div>
{/if}

<style>
	.wheel-progress-indicator {
		position: absolute;
		top: 1em;
		left: 50%;
		transform: translateX(-50%);
		background-color: var(--background-secondary);
		color: var(--text-normal);
		border-radius: var(--radius-l);
		padding: 0.3em 0.8em;
		font-size: 1.2em;
		font-weight: bold;
		box-shadow: var(--shadow-s);
		z-index: 100;
		opacity: 0;
		animation: fade-in 0.2s ease-out forwards;
		user-select: none;
		display: flex;
		align-items: center;
		gap: 0.5em;
		border: 1px solid var(--background-modifier-border);
	}

	.wheel-progress-indicator.bottom {
		top: unset;
		bottom: 3em;
	}

	.wheel-progress-indicator.refreshing {
		padding: 0.5em;
	}

	.progress-bar-wrapper {
		width: 50px;
		height: 8px;
		background-color: var(--background-modifier-border);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		background-color: var(--interactive-accent);
		transition: width 0.1s linear;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translate(-50%, -10px);
		}
		to {
			opacity: 0.9;
			transform: translate(-50%, 0);
		}
	}
</style>
