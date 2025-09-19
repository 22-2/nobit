<script lang="ts">
    export let message: string;
</script>

<div class="info-popup">
    {message}
</div>

<style>
    .info-popup {
        position: absolute;
        background-color: #333;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        z-index: 1000;
        font-size: 14px;
    }
</style>
