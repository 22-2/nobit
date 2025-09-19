<script lang="ts">
    interface Props {
        size?: "small" | "medium" | "large";
        color?: string;
        strokeWidth?: number;
        speed?: "slow" | "normal" | "fast";
    }

    let {
        size = "medium",
        color = "var(--interactive-accent)",
        strokeWidth = 2,
        speed = "normal",
    }: Props = $props();

    const sizeMap = {
        small: 16,
        medium: 24,
        large: 32,
    };

    const speedMap = {
        slow: "2s",
        normal: "1s",
        fast: "0.5s",
    };

    const diameter = $derived(sizeMap[size]);
    const animationDuration = $derived(speedMap[speed]);
</script>

<div
    class="loading-spinner"
    style="
        width: {diameter}px;
        height: {diameter}px;
        --spinner-color: {color};
        --animation-duration: {animationDuration};
    "
    role="status"
    aria-label="読み込み中"
>
    <svg
        width={diameter}
        height={diameter}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle
            cx="12"
            cy="12"
            r="10"
            stroke="var(--spinner-color)"
            stroke-width={strokeWidth}
            stroke-linecap="round"
            stroke-dasharray="31.416"
            stroke-dashoffset="31.416"
            class="spinner-circle"
        />
    </svg>
</div>

<style>
    .loading-spinner {
        display: inline-block;
        animation: spin var(--animation-duration) linear infinite;
    }

    .spinner-circle {
        animation: dash var(--animation-duration) ease-in-out infinite;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    @keyframes dash {
        0% {
            stroke-dasharray: 1, 150;
            stroke-dashoffset: 0;
        }
        50% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -35;
        }
        100% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -124;
        }
    }
</style>
