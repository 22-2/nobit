<script lang="ts">
	import type { Post, Thread } from "src/lib/types";
	import type { PopoverService } from "src/store/usePopover.svelte";
	import { getContext } from "svelte";
	import type {
		HoverDetail,
		ShowIdPostsDetail,
		ShowPostContextMenuDetail,
		ShowReplyTreeDetail,
		ThreadLinkClickDetail,
	} from "./PostItem.svelte";
	import PostItem from "./PostItem.svelte";
	import PostTree from "./PostTree.svelte";

	let {
		post,
		thread,
		level = 0,
		onHoverPostLink,
		onLeavePostLink,
		onJumpToPost,
		onShowReplyTree,
		onShowIdPosts,
		onShowPostContextMenu,
		onThreadLinkClick,
	}: {
		post: Post;
		thread: Thread;
		level?: number;
		// PostItemに合わせてオプショナルにする
		onHoverPostLink?: (detail: HoverDetail) => void;
		onLeavePostLink?: () => void;
		onJumpToPost?: (resNumber: number) => void;
		onShowReplyTree?: (detail: ShowReplyTreeDetail) => void;
		onShowIdPosts?: (detail: ShowIdPostsDetail) => void;
		onShowPostContextMenu?: (detail: ShowPostContextMenuDetail) => void;
		onThreadLinkClick?: (detail: ThreadLinkClickDetail) => void;
	} = $props();

	const replies = post.replies
		.map((replyNum) => thread.posts[replyNum - 1])
		.filter((p): p is Post => p !== undefined);

	// Get popoverService from context if available
	const popoverService = getContext<PopoverService | undefined>(
		"popoverService",
	);

	// --- [修正] onLeavePostLinkの処理をまとめる ---
	function handleLeavePostLink() {
		if (popoverService) {
			popoverService.startHideTimer();
		}
		if (onLeavePostLink) {
			onLeavePostLink();
		}
	}
</script>

<div
	class="post-tree-node"
	style="--level: {level}"
	onclick={(e) => {
		// リンクやボタン以外をクリックした場合、イベントを伝播させる
		const target = e.target as HTMLElement;
		if (
			!target.closest("a, button, .internal-res-link, .reply-tree-link")
		) {
			// 何もしない（イベントを伝播させる）
		}
	}}
>
	<!-- --- [修正] 全てのプロパティをPostItemに渡す --- -->
	<PostItem
		{post}
		index={thread.posts.indexOf(post)}
		{onHoverPostLink}
		onLeavePostLink={handleLeavePostLink}
		{onJumpToPost}
		{onShowReplyTree}
		{onShowIdPosts}
		{onShowPostContextMenu}
		{onThreadLinkClick}
	/>
	{#if replies.length > 0}
		<div class="post-tree-replies">
			{#each replies as reply}
				<!-- --- [修正] 全てのプロパティを再帰的にPostTreeに渡す --- -->
				<PostTree
					post={reply}
					{thread}
					level={level + 1}
					{onHoverPostLink}
					{onLeavePostLink}
					{onJumpToPost}
					{onShowReplyTree}
					{onShowIdPosts}
					{onShowPostContextMenu}
					{onThreadLinkClick}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.post-tree-node {
		/* prettier-ignore */
		margin-left: calc(var(--level) * var(--size-4-3));
		border-left: var(--size-2-1) solid var(--background-modifier-border);
		padding-left: var(--size-4-2);
		contain: content;
		padding: var(--size-4-1) var(--size-4-3);
		overflow-y: scroll;
	}
	.post-tree-replies {
		margin-top: 2px;
	}
</style>
