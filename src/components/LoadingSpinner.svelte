<script lang="ts">
    interface Props {
        size?: "small" | "medium" | "large" | "extra-large";
        color?: string;
        strokeWidth?: number;
        speed?: "slow" | "normal" | "fast";
    }

    let {
        size = "medium",
        color = "var(--nobit-interactive-accent)",
        strokeWidth = 2,
        speed = "normal",
    }: Props = $props();

    const sizeMap = {
        small: "var(--nobit-size-4-4)", // 16px
        medium: "var(--nobit-size-4-6)", // 24px
        large: "var(--nobit-size-4-8)", // 32px
        "extra-large": "var(--nobit-size-4-12)", // 48px
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
        width: {diameter};
        height: {diameter};
        --spinner-color: {color};
        --animation-duration: {animationDuration};
    "
    role="status"
    aria-label="読み込み中"
>
    <svg
        width="100%"
        height="100%"
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
        position: relative;
        z-index: var(--nobit-layer-popover);
    }

    .spinner-circle {
        animation: dash var(--animation-duration) ease-in-out infinite;
        transform-origin: center;
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

    @media (prefers-reduced-motion: reduce) {
        .loading-spinner {
            animation-duration: 3s;
        }
        .spinner-circle {
            animation-duration: 3s;
        }
    }
</style>
