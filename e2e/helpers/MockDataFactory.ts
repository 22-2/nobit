/**
 * モックデータ生成のファクトリークラス
 * Open/Closed Principle: 新しいモックタイプを追加しやすい設計
 */
export class MockDataFactory {
	/**
	 * 基本的なスレッドDATコンテンツを生成
	 */
	static createBasicThreadData(): string {
		return `1<>名無しさん@転載は禁止<><>2024/01/01(月) 10:00:00.00 ID:ABC123DE<>これは基本的なポストの例です。<br>5chの実際のデータ構造に基づいています。<>テストスレッド
2<>名無しさん@転載は禁止<><>2024/01/01(月) 10:05:00.00 ID:DEF456GH<>画像付きのポストです。<br>複数の画像が添付されています。<>
3<>名無しさん@転載は禁止<>sage<>2024/01/01(月) 10:10:00.00 ID:GHI789JK<>>>1 >>2<br>アンカー付きのポストです。<br>複数のレスを参照しています。<>
4<>名無しさん@転載は禁止<><>2024/01/01(月) 10:15:00.00 ID:JKL012MN<>同じIDで複数回投稿しているユーザーです。<br>このIDは3回投稿しています。<>
5<>長文投稿者@転載は禁止<><>2024/01/01(月) 10:20:00.00 ID:LONG123OP<>これは非常に長いコンテンツのポストです。<br>複数行にわたって書かれており、改行も含まれています。<br><br>段落も分かれていて、読みやすさをテストするためのものです。<>
6<>テストユーザー<><>2024/01/01(月) 10:25:00.00 ID:TEST456QR<>フィルタリングテスト用のポストです。<br>特定のキーワードを含んでいます。<>
7<>名無しさん@転載は禁止<>sage<>2024/01/01(月) 10:30:00.00 ID:SAGE789ST<>sageで投稿されたポストです。<br>メール欄にsageが入っています。<>
8<>名無しさん@転載は禁止<><>2024/01/01(月) 10:35:00.00 ID:NORMAL12UV<>>>3 >>5<br>複数のアンカーを含むポストです。<br>レス関係をテストします。<>`;
	}

	/**
	 * 大規模スレッドデータを生成
	 */
	static createLargeThreadData(postCount: number): string {
		const posts: string[] = [];

		for (let i = 1; i <= postCount; i++) {
			const authorName = `テストユーザー${i % 100}`;
			const mail = i % 20 === 0 ? "sage" : "";
			const authorId = `ID${String(i % 1000).padStart(3, "0")}ABC`;
			const timestamp = `2024/01/01(月) ${String(10 + (i % 14)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}.${String((i * 13) % 100).padStart(2, "0")}`;

			let content = `これは投稿番号${i}のテストポストです。`;

			if (i % 10 === 0) {
				content += `<br>長めのコンテンツを含む投稿です。<br>複数行にわたって書かれています。<br>パフォーマンステストのためのデータです。`;
			}

			if (i % 25 === 0) {
				content += `<br>>>${Math.max(1, i - 5)} >>${Math.max(1, i - 10)}<br>アンカー付きの投稿です。`;
			}

			if (i % 50 === 0) {
				content += `<br>https://example.com/image${i}.jpg<br>画像URLを含む投稿です。`;
			}

			const threadTitle = i === 1 ? "パフォーマンステスト用大規模スレッド" : "";

			posts.push(
				`${i}<>${authorName}<>${mail}<>${timestamp} ${authorId}<>${content}<>${threadTitle}`
			);
		}

		return posts.join("\n");
	}

	/**
	 * 空のスレッドデータを生成
	 */
	static createEmptyThreadData(): string {
		return "1<>名無しさん@転載は禁止<><>2024/01/01(月) 10:00:00.00 ID:ABC123DE<>空のスレッドです。<>空スレッド";
	}

	/**
	 * エラーレスポンスを生成
	 */
	static createErrorResponse(status = 500): MockResponse {
		return {
			status,
			contentType: "text/plain",
			body: status === 500 ? "Internal Server Error" : "Request Timeout",
		};
	}

	/**
	 * 成功レスポンスを生成
	 */
	static createSuccessResponse(body: string): MockResponse {
		return {
			status: 200,
			contentType: "text/html; charset=Shift_JIS",
			body,
		};
	}
}

export interface MockResponse {
	status: number;
	contentType: string;
	body: string | Buffer;
}
