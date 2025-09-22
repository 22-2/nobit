<script lang="ts">
    let {
        isOpen = false,
        isClickable = true,
        icon = true,
        children,
        onclick,
    } = $props<{
        isOpen?: boolean;
        isClickable?: boolean;
        icon?: boolean;
        children: any;
        onclick?: () => void;
    }>();
</script>

<div class="tree-item nav-folder" class:is-collapsed={!isOpen}>
    <div
        class="tree-item-self"
        class:is-clickable={isClickable}
        class:nav-folder-title={icon}
        class:nav-file-title={!icon}
        {onclick}
    >
        {#if icon}
            <div class="tree-item-icon collapse-icon">
                <svg viewBox="0 0 100 100" class="right-triangle">
                    <path
                        fill="currentColor"
                        stroke="currentColor"
                        d="M 95,50 5,95 5,5 Z"
                    />
                </svg>
            </div>
        {/if}
        <div
            class="tree-item-inner"
            class:nav-folder-title-content={icon}
            class:nav-file-title-content={!icon}
        >
            {@render children()}
        </div>
    </div>
</div>

<style>
    .tree-item-self {
        display: flex;
        align-items: center;
        padding: var(--nobit-size-4-1) var(--nobit-size-4-2);
        border-radius: var(--nobit-radius-s);
        cursor: pointer;
    }

    .tree-item-self:hover {
        background-color: var(--nobit-background-modifier-hover);
    }

    .tree-item-inner {
        flex-grow: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .collapse-icon {
        width: var(--nobit-size-4-6);
        height: var(--nobit-size-4-6);
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(90deg);
        transition: transform 0.1s ease-in-out;
        color: var(--nobit-icon-color);
    }

    .nav-folder.is-collapsed .collapse-icon {
        transform: rotate(0deg);
    }

    .collapse-icon svg {
        width: var(--nobit-size-4-2);
        height: var(--nobit-size-4-2);
        opacity: 0.5;
    }
</style>
