// src/view/thread/ThreadView.test.ts

import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import ThreadView from "./ThreadView.svelte";
import type { Thread, Post, ThreadFilters, PostData } from "../../types";

// 統合テストから流用したモックデータ
const mockPosts: Post[] = [
    {
        resNum: 1,
        authorName: "名無しさん",
        authorId: "ABCDE",
        date: new Date("2025-09-20T10:00:00Z"),
        content: "これは最初の投稿です。特定のキーワードを含みます。",
        imageUrls: [],
        replies: [3],
        postIdCount: 2,
        siblingPostNumbers: [1, 4],
        hasExternalLink: false,
        hasImage: false,
        mail: "",
        references: [],
    },
    {
        resNum: 2,
        authorName: "名無しさん",
        authorId: "FGHIJ",
        date: new Date("2025-09-20T10:05:00Z"),
        content: `これは画像付きの投稿です。<a class="internal-res-link" href="#" data-res-number="1">&gt;&gt;1</a>へのアンカー。`,
        imageUrls: ["http://example.com/image.jpg"],
        replies: [],
        postIdCount: 1,
        siblingPostNumbers: [2],
        hasExternalLink: true,
        hasImage: true,
        mail: "",
        references: [1],
    },
    {
        resNum: 3,
        authorName: "別の名無しさん",
        authorId: "KLMNO",
        date: new Date("2025-09-20T10:10:00Z"),
        content: "これは3番目の投稿です。",
        imageUrls: [],
        replies: [],
        postIdCount: 1,
        siblingPostNumbers: [3],
        hasExternalLink: false,
        hasImage: false,
        mail: "",
        references: [],
    },
    {
        resNum: 4,
        authorName: "名無しさん",
        authorId: "ABCDE", // 1番と同じID
        date: new Date("2025-09-20T10:15:00Z"),
        content: "同じIDからの投稿です。",
        imageUrls: [],
        replies: [],
        postIdCount: 2,
        siblingPostNumbers: [1, 4],
        hasExternalLink: false,
        hasImage: false,
        mail: "",
        references: [],
    },
];

const mockThread: Thread = {
    title: "テストスレッド",
    url: "http://example.com/thread",
    posts: mockPosts,
};

// デフォルトのフィルター状態
const initialFilters: ThreadFilters = {
    searchText: "",
    image: false,
    video: false,
    external: false,
    internal: false,
    popular: false,
};

describe("ThreadView.svelte Unit Test", () => {
    // 1. 基本的なレンダリングのテスト
    describe("Basic Rendering", () => {
        it("should show a loading spinner when the thread is null", () => {
            render(ThreadView, {
                thread: null,
                filters: { ...initialFilters },
                onPost: vi.fn(),
            });
            expect(screen.getByRole("status")).toBeInTheDocument(); // LoadingSpinnerコンポーネントのデフォルトロール
            expect(screen.queryByRole("feed")).not.toBeInTheDocument();
        });

        it("should render all posts when thread data is provided", () => {
            render(ThreadView, {
                thread: mockThread,
                filters: { ...initialFilters },
                onPost: vi.fn(),
            });
            const posts = screen.getAllByRole("article");
            expect(posts.length).toBe(mockPosts.length);
            expect(
                screen.getByText(/これは最初の投稿です/)
            ).toBeInTheDocument();
        });
    });

    // 2. フィルタリング機能のテスト
    describe("Filtering Logic", () => {
        it("should filter posts by search text", async () => {
            const { component } = render(ThreadView, {
                thread: mockThread,
                filters: { ...initialFilters },
                onPost: vi.fn(),
            });

            const searchInput = screen.getByPlaceholderText("検索...");
            await fireEvent.input(searchInput, {
                target: { value: "画像付き" },
            });

            await waitFor(() => {
                const posts = screen.getAllByRole("article");
                expect(posts.length).toBe(1);
                expect(
                    screen.getByText(/これは画像付きの投稿です/)
                ).toBeInTheDocument();
                expect(
                    screen.queryByText(/これは最初の投稿です/)
                ).not.toBeInTheDocument();
            });
        });

        it("should filter posts by image toggle", async () => {
            render(ThreadView, {
                thread: mockThread,
                filters: { ...initialFilters },
                onPost: vi.fn(),
            });

            const imageFilterButton =
                screen.getByLabelText("画像を含むレスで絞り込む");
            await fireEvent.click(imageFilterButton);

            await waitFor(() => {
                const posts = screen.getAllByRole("article");
                expect(posts.length).toBe(1);
                expect(
                    screen.getByText(/これは画像付きの投稿です/)
                ).toBeInTheDocument();
            });

            // トグルを解除して元に戻ることを確認
            await fireEvent.click(imageFilterButton);
            await waitFor(() => {
                expect(screen.getAllByRole("article").length).toBe(
                    mockPosts.length
                );
            });
        });
    });

    // 3. 書き込みフォームのテスト
    describe("Write Form Interaction", () => {
        it("should show the form on button click and hide it on cancel", async () => {
            render(ThreadView, {
                thread: mockThread,
                filters: { ...initialFilters },
                onPost: vi.fn(),
            });

            // 初期状態ではフォームは非表示
            expect(
                screen.queryByPlaceholderText("書き込み内容（sageはmail欄へ）")
            ).not.toBeInTheDocument();

            const writeButton = screen.getByText("書き込む");
            await fireEvent.click(writeButton);

            // ボタンクリックでフォームが表示される
            expect(
                screen.getByPlaceholderText("書き込み内容（sageはmail欄へ）")
            ).toBeInTheDocument();

            const cancelButton = screen.getByText("キャンセル");
            await fireEvent.click(cancelButton);

            // キャンセルでフォームが非表示になる
            expect(
                screen.queryByPlaceholderText("書き込み内容（sageはmail欄へ）")
            ).not.toBeInTheDocument();
        });

        it("should call onPost and hide the form after successful submission", async () => {
            // <<< [修正] START: 非同期処理を制御できるように変更
            let resolvePost: (value: void) => void;
            const postPromise = new Promise<void>((resolve) => {
                resolvePost = resolve;
            });
            const handlePost = vi.fn().mockImplementation(() => postPromise);
            // <<< [修正] END

            render(ThreadView, {
                thread: mockThread,
                filters: { ...initialFilters },
                onPost: handlePost,
            });

            await fireEvent.click(screen.getByText("書き込む"));

            const textarea = screen.getByPlaceholderText(
                "書き込み内容（sageはmail欄へ）"
            );
            const submitButton = screen.getByText("投稿");

            await fireEvent.input(textarea, {
                target: { value: "テスト投稿" },
            });
            await fireEvent.click(submitButton);

            // onPostが正しいデータで呼び出されること
            expect(handlePost).toHaveBeenCalledWith({
                name: "",
                mail: "",
                content: "テスト投稿",
            });

            // 投稿中はボタンが無効化されること
            await screen.findByText("投稿中...");

            // <<< [修正] START: Promiseを解決して投稿処理を完了させる
            // @ts-ignore
            resolvePost();
            // <<< [修正] END

            // onPostのPromiseが解決された後、フォームが非表示になること
            await waitFor(() => {
                expect(
                    screen.queryByPlaceholderText(
                        "書き込み内容（sageはmail欄へ）"
                    )
                ).not.toBeInTheDocument();
            });
        });
    });

    // 4. PostItemからのイベント伝播のテスト
    describe("Event Propagation from PostItem", () => {
        it("should call onShowIdPosts when an ID link is clicked", async () => {
            const onShowIdPosts = vi.fn();
            render(ThreadView, {
                thread: mockThread,
                filters: { ...initialFilters },
                onPost: vi.fn(),
                onShowIdPosts,
            });

            const idLink = screen.getAllByText("ABCDE")[0];
            await fireEvent.click(idLink);

            expect(onShowIdPosts).toHaveBeenCalledTimes(1);
            expect(onShowIdPosts).toHaveBeenCalledWith(
                expect.objectContaining({
                    post: mockPosts[0],
                    siblingPostNumbers: [1, 4],
                })
            );
        });

        // ⭐ ユーザー様ご要望のテストケース
        it("should call onShowIdPosts twice when two links for the same ID are clicked", async () => {
            const onShowIdPosts = vi.fn();
            render(ThreadView, {
                thread: mockThread,
                filters: { ...initialFilters },
                onPost: vi.fn(),
                onShowIdPosts,
            });

            const idLinks = screen.getAllByText("ABCDE");
            expect(idLinks).toHaveLength(2);

            // 1回目のクリック
            await fireEvent.click(idLinks[0]);
            expect(onShowIdPosts).toHaveBeenCalledTimes(1);
            expect(onShowIdPosts).toHaveBeenCalledWith(
                expect.objectContaining({
                    post: mockPosts[0], // 1番目の投稿
                    siblingPostNumbers: [1, 4],
                })
            );

            // 2回目のクリック
            await fireEvent.click(idLinks[1]);
            expect(onShowIdPosts).toHaveBeenCalledTimes(2);
            expect(onShowIdPosts).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    post: mockPosts[3], // 4番目の投稿
                    siblingPostNumbers: [1, 4],
                })
            );
        });

        it("should call onJumpToPost when an internal res link is clicked", async () => {
            const onJumpToPost = vi.fn();
            render(ThreadView, {
                thread: mockThread,
                filters: { ...initialFilters },
                onPost: vi.fn(),
                onJumpToPost,
            });

            const resLink = screen.getByText(">>1");
            await fireEvent.click(resLink);

            expect(onJumpToPost).toHaveBeenCalledTimes(1);
            expect(onJumpToPost).toHaveBeenCalledWith(1);
        });
    });
});
