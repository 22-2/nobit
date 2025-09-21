// E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\view\thread\ThreadIntegration.test.ts
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import { describe, it, expect, vi } from "vitest";
import TestHost from "./TestHost.svelte";
import type { Post } from "../../types";

// テスト用のダミーデータ (変更なし)
const mockPosts: Post[] = [
    {
        id: "1",
        authorName: "名無しさん",
        authorId: "ABCDE",
        date: new Date("2025-09-20T10:00:00Z"),
        content: "これは最初の投稿です。特定のキーワードを含みます。",
        imageUrls: [],
        replies: [],
        postIdCount: 1,
        siblingPostNumbers: [1],
    },
    {
        id: "2",
        authorName: "名無しさん",
        authorId: "FGHIJ",
        date: new Date("2025-09-20T10:05:00Z"),
        content: "これは画像付きの投稿です。",
        imageUrls: ["http://example.com/image.jpg"],
        replies: [],
        postIdCount: 1,
        siblingPostNumbers: [2],
    },
    {
        id: "3",
        authorName: "別の名無しさん",
        authorId: "KLMNO",
        date: new Date("2025-09-20T10:10:00Z"),
        content: "これは3番目の投稿です。",
        imageUrls: [], // imageUrlsを追加
        replies: [],
        postIdCount: 1,
        siblingPostNumbers: [3],
    },
];

describe("Thread Integration Test", () => {
    it("should render all posts initially", () => {
        render(TestHost, { props: { initialPosts: mockPosts } });

        const posts = screen.getAllByRole("article");
        expect(posts.length).toBe(3);
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

        // ▼ 変更点: waitFor を使ってDOMの更新を待つ
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
        // ▼ 変更点: こちらも waitFor で待つ
        await waitFor(() => {
            expect(screen.getAllByRole("article").length).toBe(3);
        });
    });

    it("should filter posts by image button", async () => {
        render(TestHost, { props: { initialPosts: mockPosts } });

        const imageFilterButton =
            screen.getByLabelText("画像を含むレスで絞り込む");
        await fireEvent.click(imageFilterButton);

        // ▼ 変更点: waitFor を追加
        await waitFor(() => {
            expect(screen.getAllByRole("article").length).toBe(1);
            expect(
                screen.getByText(/これは画像付きの投稿です/)
            ).toBeInTheDocument();
        });

        // フィルタを解除
        await fireEvent.click(imageFilterButton);
        // ▼ 変更点: waitFor を追加
        await waitFor(() => {
            expect(screen.getAllByRole("article").length).toBe(3);
        });
    });

    it("should filter with combined filters (text and image)", async () => {
        render(TestHost, { props: { initialPosts: mockPosts } });

        const searchInput = screen.getByPlaceholderText("検索...");
        await fireEvent.input(searchInput, { target: { value: "投稿" } });

        // ▼ 変更点: waitFor を追加
        await waitFor(() => {
            // この時点で3件ヒットする
            expect(screen.getAllByRole("article").length).toBe(3);
        });

        const imageFilterButton =
            screen.getByLabelText("画像を含むレスで絞り込む");
        await fireEvent.click(imageFilterButton);

        // ▼ 変更点: waitFor を追加
        await waitFor(() => {
            // 「投稿」を含み、かつ画像があるのは1件だけ
            expect(screen.getAllByRole("article").length).toBe(1);
            expect(
                screen.getByText(/これは画像付きの投稿です/)
            ).toBeInTheDocument();
        });
    });

    // このテストケースは元々 waitFor を使っているので、おそらく問題なく動作します
    it("should show write form, submit a new post, and clear the form", async () => {
        const handlePost = vi.fn().mockResolvedValue(undefined);
        render(TestHost, { props: { initialPosts: mockPosts, handlePost } });

        // 1. 「書き込む」ボタンをクリックしてフォームを表示
        const writeButton = screen.getByText("書き込む");
        await fireEvent.click(writeButton);
        const textarea = screen.getByPlaceholderText(
            "書き込み内容（sageはmail欄へ）"
        );
        const submitButton = screen.getByText("投稿");
        expect(textarea).toBeInTheDocument();
        expect(submitButton).toBeDisabled();

        // 2. 内容を入力して投稿ボタンが有効になることを確認
        await fireEvent.input(textarea, {
            target: { value: "新しい投稿です" },
        });
        expect(submitButton).not.toBeDisabled();

        // 3. 投稿ボタンをクリック
        await fireEvent.click(submitButton);

        // 4. モック関数が正しい引数で呼ばれたことを確認
        expect(handlePost).toHaveBeenCalledWith({
            name: "",
            mail: "",
            content: "新しい投稿です",
        });
        expect(screen.getByText("投稿中...")).toBeInTheDocument();

        // 5. フォームが消え、新しい投稿がリストに表示されるのを待つ
        await waitFor(() => {
            expect(
                screen.queryByPlaceholderText("書き込み内容（sageはmail欄へ）")
            ).not.toBeInTheDocument();
            expect(screen.getByText("新しい投稿です")).toBeInTheDocument();
        });

        // 6. 投稿数が4に増えていることを確認
        expect(screen.getAllByRole("article").length).toBe(4);
    });
});
