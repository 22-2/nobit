import type { App } from "obsidian";
import { HttpError } from "src/lib/libch/fetcher";
import { getErrorMessage } from "./utils";

/**
 * Configuration options for BaseManager
 */
export interface BaseManagerOptions {}

/**
 * BaseManager provides common functionality for 5ch data managers.
 * This class encapsulates shared error handling logic that can be reused
 * across ThreadManager, BoardView, and BoardListView.
 *
 * Key responsibilities:
 * - Formats user-friendly error messages in Japanese
 * - Handles HTTP errors with appropriate messages
 */
export abstract class BaseManager {
	constructor(
		protected app: App,
		options: BaseManagerOptions = {},
	) {}

	/**
	 * Format error messages in a user-friendly way with Japanese text.
	 *
	 * @param error - The error to format
	 * @param context - Optional context string (e.g., "thread", "board", "board list")
	 * @returns User-friendly error message in Japanese
	 */
	protected formatUserFriendlyError(
		error: unknown,
		context: string = "データ",
	): string {
		const message = getErrorMessage(error);

		if (error instanceof HttpError) {
			return this.formatHttpError(error);
		}

		if (message.includes("タイムアウト")) {
			return "接続がタイムアウトしました。ネットワーク接続を確認してください。";
		}

		if (this.isNetworkError(message)) {
			return "ネットワーク接続エラーが発生しました。インターネット接続を確認してください。";
		}

		if (message.includes("解析")) {
			return `${context}の解析中にエラーが発生しました。データが破損している可能性があります。`;
		}

		return `${context}の読み込みに失敗しました: ${message || "不明なエラー"}`;
	}

	/**
	 * Check if error is a network-related error.
	 *
	 * @param message - Error message
	 * @returns True if network error
	 */
	private isNetworkError(message: string): boolean {
		return message.includes("Failed to fetch") || message.includes("Network");
	}

	/**
	 * Format HTTP error into user-friendly Japanese message.
	 *
	 * @param error - HttpError instance
	 * @returns Formatted error message
	 */
	private formatHttpError(error: HttpError): string {
		const statusMessages: Record<number, string> = {
			404: "データが見つかりません。URLを確認してください。",
			403: "アクセスが拒否されました。しばらく時間をおいてから再試行してください。",
			429: "アクセス頻度が高すぎます。しばらく時間をおいてから再試行してください。",
			500: "サーバーエラーが発生しました。しばらく時間をおいてから再試行してください。",
			502: "サーバーエラーが発生しました。しばらく時間をおいてから再試行してください。",
			503: "サーバーエラーが発生しました。しばらく時間をおいてから再試行してください。",
		};

		return (
			statusMessages[error.status] ||
			`ネットワークエラーが発生しました (HTTP ${error.status})。`
		);
	}
}
