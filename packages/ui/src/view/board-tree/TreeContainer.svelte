<script lang="ts">
    let { children } = $props<{
        children: any;
    }>();
</script>

<div class="tree-item-children nav-folder-children">
    {@render children()}
</div>

<style>
    .tree-item-children {
        padding-left: var(--nobit-size-4-3); /* 12px */
        border-left: 1px solid var(--nobit-nav-indentation-guide-color);
        margin-left: 12px;
    }
</style>
