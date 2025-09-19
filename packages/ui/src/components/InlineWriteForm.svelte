<!-- apps/obsidian-plugin/src/components/InlineWriteForm.svelte -->
<script lang="ts">
    import type { PostData } from "../types";

    let {
        handlePost,
        onCancel,
        isSubmitting = $bindable(false),
    } = $props<{
        handlePost: (postData: PostData) => Promise<void>;
        onCancel: () => void;
        isSubmitting?: boolean;
    }>();

    let content = $state("");

    async function submit() {
        if (!content.trim() || isSubmitting) return;
        isSubmitting = true;
        try {
            await handlePost({ name: "", mail: "", content });
            // `handlePost`が正常に完了した場合 (例外をスローしなかった場合)
            content = "";
            onCancel(); // フォームを閉じる
        } catch (e) {
            // エラーは呼び出し元サービスで処理される想定だが、デバッグのためにログに残す
            console.error("Failed to post:", e);
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="inline-write-form">
    <textarea
        bind:value={content}
        placeholder="書き込み内容（sageはmail欄へ）"
        rows="3"
    ></textarea>
    <div class="form-actions">
        <button onclick={onCancel}>キャンセル</button>
        <button
            class="mod-cta"
            onclick={submit}
            disabled={isSubmitting || !content.trim()}
        >
            {isSubmitting ? "投稿中..." : "投稿"}
        </button>
    </div>
</div>

<style>
    .inline-write-form {
        padding-top: 1em;
        border-top: 1px solid var(--background-modifier-border);
        display: flex;
        flex-direction: column;
        gap: 0.5em;
    }
    .inline-write-form textarea {
        resize: vertical;
        min-height: 4em;
        max-height: 10em; /* 5行分くらいに制限 */
    }
    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5em;
    }
</style>
