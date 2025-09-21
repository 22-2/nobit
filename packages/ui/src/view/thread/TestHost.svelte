<script lang="ts">
    import type { PostData, ThreadFilters, Post } from "../../types";
    import ThreadFiltersComponent from "./ThreadFilters.svelte";
    import PostItem from "./PostItem.svelte";
    import InlineWriteForm from "./InlineWriteForm.svelte";

    type ShowReplyTreeDetail = {
        targetEl: HTMLElement;
        originResNumber: number;
        event: MouseEvent;
    };
    type ShowIdPostsDetail = {
        targetEl: HTMLElement;
        siblingPostNumbers: number[];
        event: MouseEvent;
    };
    type ShowPostContextMenuDetail = {
        post: Post;
        index: number;
        event: MouseEvent;
    };

    let {
        initialPosts = [],
        handlePost = async (_: PostData) => {},
        onJumpToPost = (_: number) => {},
        onShowReplyTree = (_: ShowReplyTreeDetail) => {},
        onShowIdPosts = (_: ShowIdPostsDetail) => {},
        onShowPostContextMenu = (_: ShowPostContextMenuDetail) => {},
    }: {
        initialPosts?: Post[];
        handlePost?: (postData: PostData) => Promise<void>;
        onJumpToPost?: (resNumber: number) => void;
        onShowReplyTree?: (detail: ShowReplyTreeDetail) => void;
        onShowIdPosts?: (detail: ShowIdPostsDetail) => void;
        onShowPostContextMenu?: (detail: ShowPostContextMenuDetail) => void;
    } = $props();

    let posts = $state(initialPosts);

    let filters = $state<ThreadFilters>({
        popular: false,
        image: false,
        video: false,
        external: false,
        internal: false,
        searchText: "",
    });

    let isWriteFormVisible = $state(false);

    const filteredPosts = $derived(() => {
        return posts.filter((post) => {
            if (!post) return false;

            const searchText = filters.searchText.toLowerCase().trim();
            if (
                searchText &&
                !post.content.toLowerCase().includes(searchText)
            ) {
                return false;
            }
            if (
                filters.image &&
                (!post.imageUrls || post.imageUrls.length === 0)
            ) {
                return false;
            }
            return true;
        });
    });

    async function submitPost(postData: PostData) {
        await handlePost(postData);

        const newPost: Post = {
            id: `post-${posts.length + 1}`,
            authorName: postData.name || "名無しさん",
            authorId: "TESTID",
            date: new Date(),
            content: postData.content,
            imageUrls: [],
            replies: [],
            postIdCount: 1,
            siblingPostNumbers: [posts.length + 1],
        };
        posts = [...posts, newPost];
        isWriteFormVisible = false; // フォームを閉じる
    }
</script>

<div class="thread-view-test-host">
    <ThreadFiltersComponent bind:filters isVisible={true} />

    <div class="posts-list">
        {#each filteredPosts() as post (post.id)}
            <PostItem
                {post}
                index={posts.indexOf(post)}
                {onJumpToPost}
                {onShowReplyTree}
                {onShowIdPosts}
                {onShowPostContextMenu}
            />
        {/each}
    </div>

    {#if isWriteFormVisible}
        <InlineWriteForm
            handlePost={submitPost}
            onCancel={() => (isWriteFormVisible = false)}
        />
    {:else}
        <button onclick={() => (isWriteFormVisible = true)}>書き込む</button>
    {/if}
</div>
