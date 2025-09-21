// E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\view\thread\ThreadIntegration.test.ts
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import TestHost from "./TestHost.svelte";
import type { Post } from "../../types";

// テスト用のダミーデータ (Post型に準拠)
const mockPosts: Post[] = [
    {
        resNum: 1,
        authorName: "名無しさん",
        authorId: "ABCDE",
        date: new Date("2025-09-20T10:00:00Z"),
        content: "これは最初の投稿です。特定のキーワードを含みます。",
        mail: "",
        imageUrls: [],
        references: [],
        replies: [3],
        postIdCount: 2,
        siblingPostNumbers: [1, 4],
        hasImage: false,
        hasExternalLink: false,
    },
    {
        resNum: 2,
        authorName: "名無しさん",
        authorId: "FGHIJ",
        date: new Date("2025-09-20T10:05:00Z"),
        content: `これは画像付きの投稿です。<a class="internal-res-link" href="#" data-res-number="1">&gt;&gt;1</a>へのアンカー。`,
        mail: "",
        imageUrls: ["http://example.com/image.jpg"],
        references: [1],
        replies: [],
        postIdCount: 1,
        siblingPostNumbers: [2],
        hasImage: true,
        hasExternalLink: false,
    },
    {
        resNum: 3,
        authorName: "別の名無しさん",
        authorId: "KLMNO",
        date: new Date("2025-09-20T10:10:00Z"),
        content: "これは3番目の投稿です。",
        mail: "",
        imageUrls: [],
        references: [1],
        replies: [],
        postIdCount: 1,
        siblingPostNumbers: [3],
        hasImage: false,
        hasExternalLink: false,
    },
    {
        resNum: 4,
        authorName: "名無しさん",
        authorId: "ABCDE", // 1番と同じID
        date: new Date("2025-09-20T10:15:00Z"),
        content: "同じIDからの投稿です。",
        mail: "",
        imageUrls: [],
        references: [],
        replies: [],
        postIdCount: 2,
        siblingPostNumbers: [1, 4],
        hasImage: false,
        hasExternalLink: false,
    },
];

describe("Thread Integration Test", () => {
    it("should render all posts initially", () => {
        render(TestHost, { props: { initialPosts: mockPosts } });

        const posts = screen.getAllByRole("article");
        expect(posts.length).toBe(4);
        expect(screen.getByText(/これは最初の投稿です/)).toBeInTheDocument();
        expect(
            screen.getByText(/これは画像付きの投稿です/)
        ).toBeInTheDocument();
        expect(screen.getByText(/これは3番目の投稿です/)).toBeInTheDocument();
    });

    it("should filter posts by search text", async () => {
        render(TestHost, { props: { initialPosts: mockPosts } });

        const searchInput = screen.getByPlaceholderText("検索...");
        await fireEvent.input(searchInput, { target: { value: "画像" } });

        await waitFor(() => {
            expect(screen.getAllByRole("article").length).toBe(1);
            expect(
                screen.getByText(/これは画像付きの投稿です/)
            ).toBeInTheDocument();
        });

        expect(
            screen.queryByText(/これは最初の投稿です/)
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText(/これは3番目の投稿です/)
        ).not.toBeInTheDocument();

        // 検索をクリア
        await fireEvent.input(searchInput, { target: { value: "" } });
        await waitFor(() => {
            expect(screen.getAllByRole("article").length).toBe(4);
        });
    });

    it("should filter posts by image button", async () => {
        render(TestHost, { props: { initialPosts: mockPosts } });

        const imageFilterButton =
            screen.getByLabelText("画像を含むレスで絞り込む");
        await fireEvent.click(imageFilterButton);

        await waitFor(() => {
            expect(screen.getAllByRole("article").length).toBe(1);
            expect(
                screen.getByText(/これは画像付きの投稿です/)
            ).toBeInTheDocument();
        });

        await fireEvent.click(imageFilterButton);
        await waitFor(() => {
            expect(screen.getAllByRole("article").length).toBe(4);
        });
    });

    it("should filter with combined filters (text and image)", async () => {
        render(TestHost, { props: { initialPosts: mockPosts } });

        const searchInput = screen.getByPlaceholderText("検索...");
        await fireEvent.input(searchInput, { target: { value: "投稿" } });

        await waitFor(() => {
            expect(screen.getAllByRole("article").length).toBe(4);
        });

        const imageFilterButton =
            screen.getByLabelText("画像を含むレスで絞り込む");
        await fireEvent.click(imageFilterButton);

        await waitFor(() => {
            expect(screen.getAllByRole("article").length).toBe(1);
            expect(
                screen.getByText(/これは画像付きの投稿です/)
            ).toBeInTheDocument();
        });
    });

    it("should show write form, submit a new post, and clear the form", async () => {
        let resolvePost: (value: undefined) => void;
        const postPromise = new Promise<undefined>((resolve) => {
            resolvePost = resolve;
        });
        const handlePost = vi.fn().mockImplementation(() => postPromise);
        render(TestHost, { props: { initialPosts: mockPosts, handlePost } });

        const writeButton = screen.getByText("書き込む");
        await fireEvent.click(writeButton);
        const textarea = screen.getByPlaceholderText(
            "書き込み内容（sageはmail欄へ）"
        );
        const submitButton = screen.getByText("投稿");
        await fireEvent.input(textarea, {
            target: { value: "新しい投稿です" },
        });
        await fireEvent.click(submitButton);

        expect(handlePost).toHaveBeenCalledWith({
            name: "",
            mail: "",
            content: "新しい投稿です",
        });

        await screen.findByText("投稿中...");
        // @ts-ignore
        await resolvePost(undefined);

        await waitFor(() => {
            expect(
                screen.queryByPlaceholderText("書き込み内容（sageはmail欄へ）")
            ).not.toBeInTheDocument();
            expect(screen.getByText("新しい投稿です")).toBeInTheDocument();
        });

        expect(screen.getAllByRole("article").length).toBe(5);
    });
});

describe("PostItem Interaction Tests", () => {
    it("should fire onShowIdPosts when ID link is clicked", async () => {
        const handleShowIdPosts = vi.fn();
        render(TestHost, {
            props: {
                initialPosts: mockPosts,
                onShowIdPosts: handleShowIdPosts,
            },
        });

        const idLinks = screen.getAllByText("ABCDE");
        expect(idLinks.length).toBeGreaterThan(0);
        await fireEvent.click(idLinks[0]);

        expect(handleShowIdPosts).toHaveBeenCalledTimes(1);
        expect(handleShowIdPosts).toHaveBeenCalledWith(
            expect.objectContaining({
                siblingPostNumbers: [1, 4],
            })
        );
    });

    it("should fire onShowReplyTree when reply-tree link is clicked", async () => {
        const handleShowReplyTree = vi.fn();
        render(TestHost, {
            props: {
                initialPosts: mockPosts,
                onShowReplyTree: handleShowReplyTree,
            },
        });

        const replyTreeLink = screen.getByText("返信 (1)");
        await fireEvent.click(replyTreeLink);

        expect(handleShowReplyTree).toHaveBeenCalledTimes(1);
        expect(handleShowReplyTree).toHaveBeenCalledWith(
            expect.objectContaining({
                originResNumber: 1,
            })
        );
    });

    it("should fire onJumpToPost when an internal res link is clicked", async () => {
        const handleJumpToPost = vi.fn();
        render(TestHost, {
            props: {
                initialPosts: mockPosts,
                onJumpToPost: handleJumpToPost,
            },
        });

        const anchorLink = screen.getByText(">>1");
        await fireEvent.click(anchorLink);

        expect(handleJumpToPost).toHaveBeenCalledTimes(1);
        expect(handleJumpToPost).toHaveBeenCalledWith(1);
    });

    it("should fire onShowPostContextMenu when a post is right-clicked", async () => {
        const handleShowPostContextMenu = vi.fn();
        render(TestHost, {
            props: {
                initialPosts: mockPosts,
                onShowPostContextMenu: handleShowPostContextMenu,
            },
        });

        const postElement = screen
            .getByText(/これは3番目の投稿です/)
            .closest("div.post");
        expect(postElement).not.toBeNull();
        if (postElement) {
            await fireEvent.contextMenu(postElement);
        }

        expect(handleShowPostContextMenu).toHaveBeenCalledTimes(1);
        expect(handleShowPostContextMenu).toHaveBeenCalledWith(
            expect.objectContaining({
                post: mockPosts[2],
                index: 2,
            })
        );
    });
});
