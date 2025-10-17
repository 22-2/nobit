import log from "loglevel";
import { type BufferDecoder, DefaultDecoder } from "./libch/decoder";
import { type HttpFetcher, HttpError } from "./libch/fetcher";
import { type Parser, DefaultParser } from "./libch/parser";
import { ensureError, getErrorMessage, sleep } from "../managers/utils";

const logger = log.getLogger("BaseBBSProvider");

/**
 * Retry configuration for network operations
 */
export interface RetryConfig {
	maxRetries: number;
	baseDelay: number;
	maxDelay: number;
	timeout: number;
}

/**
 * Configuration options for BaseBBSProvider
 */
export interface BaseBBSProviderOptions {
	enableRetry?: boolean;
	retryConfig?: Partial<RetryConfig>;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
	maxRetries: 3,
	baseDelay: 1000,
	maxDelay: 10000,
	timeout: 5000,
};

/**
 * BaseBBSProvider provides common functionality for BBS providers.
 * This abstract class encapsulates shared infrastructure components and error handling logic
 * that can be reused across different BBS provider implementations.
 *
 * Key responsibilities:
 * - Manages BBS communication infrastructure (fetcher, decoder, parser)
 * - Implements retry logic with exponential backoff
 * - Provides timeout handling for network requests
 * - Formats user-friendly error messages in Japanese
 * - Handles HTTP errors with appropriate messages
 */
export abstract class BaseBBSProvider {
	// Protected BBS infrastructure components
	protected readonly fetcher: HttpFetcher;
	protected readonly decoder: BufferDecoder;
	protected readonly parser: Parser;

	// Retry and timeout configuration
	protected readonly retryConfig: RetryConfig;
	protected readonly enableRetry: boolean;

	constructor(
		fetcher?: HttpFetcher,
		decoder?: BufferDecoder,
		parser?: Parser,
		options: BaseBBSProviderOptions = {},
	) {
		this.fetcher = fetcher ?? this.createDefaultFetcher();
		this.decoder = decoder ?? new DefaultDecoder();
		this.parser = parser ?? new DefaultParser();

		// Configure retry behavior
		this.enableRetry = options.enableRetry ?? true;
		this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...options.retryConfig };

		logger.debug(`${this.constructor.name} initialized`, {
			enableRetry: this.enableRetry,
			retryConfig: this.retryConfig,
		});
	}

	/**
	 * Create default fetcher instance.
	 * Subclasses can override this to provide custom fetcher implementations.
	 */
	protected abstract createDefaultFetcher(): HttpFetcher;

	/**
	 * Fetch data from URL with optional retry logic.
	 *
	 * @param url - The URL to fetch
	 * @returns Promise that resolves to ArrayBuffer
	 */
	protected async fetchWithRetry(url: string): Promise<ArrayBuffer> {
		if (this.enableRetry) {
			return this.retryWithBackoff(
				() => this.fetchWithTimeout(url),
				`fetch from ${url}`,
			);
		}
		return this.fetchWithTimeout(url);
	}

	/**
	 * Fetch data with timeout handling.
	 *
	 * @param url - The URL to fetch
	 * @returns Promise that resolves to ArrayBuffer or rejects on timeout
	 */
	protected async fetchWithTimeout(url: string): Promise<ArrayBuffer> {
		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				reject(
					new Error(
						`リクエストがタイムアウトしました (${this.retryConfig.timeout}ms)`,
					),
				);
			}, this.retryConfig.timeout);

			this.fetcher
				.fetch(url)
				.then((result) => {
					clearTimeout(timeoutId);
					resolve(result);
				})
				.catch((error) => {
					clearTimeout(timeoutId);
					reject(error);
				});
		});
	}

	/**
	 * Retry a network operation with exponential backoff.
	 *
	 * @param operation - The async operation to retry
	 * @param operationName - Human-readable name for logging
	 * @returns Promise that resolves to the operation result
	 */
	protected async retryWithBackoff<T>(
		operation: () => Promise<T>,
		operationName: string,
	): Promise<T> {
		let lastError: Error = new Error("Unknown error");

		for (
			let attempt = 0;
			attempt <= this.retryConfig.maxRetries;
			attempt++
		) {
			try {
				logger.debug(
					`Attempt ${attempt + 1}/${
						this.retryConfig.maxRetries + 1
					} for ${operationName}`,
				);
				return await operation();
			} catch (error) {
				lastError = ensureError(error);

				if (attempt === this.retryConfig.maxRetries) {
					logger.error(
						`All retry attempts failed for ${operationName}:`,
						error,
					);
					break;
				}

				const delay = this.calculateBackoffDelay(attempt);
				logger.warn(
					`Attempt ${
						attempt + 1
					} failed for ${operationName}, retrying in ${delay}ms:`,
					lastError.message,
				);
				await sleep(delay);
			}
		}

		throw lastError;
	}

	/**
	 * Calculate exponential backoff delay.
	 *
	 * @param attempt - Current attempt number (0-indexed)
	 * @returns Delay in milliseconds
	 */
	protected calculateBackoffDelay(attempt: number): number {
		return Math.min(
			this.retryConfig.baseDelay * Math.pow(2, attempt),
			this.retryConfig.maxDelay,
		);
	}

	/**
	 * Decode buffer using the configured decoder.
	 *
	 * @param buffer - The ArrayBuffer to decode
	 * @returns Decoded string content
	 */
	protected decodeBuffer(buffer: ArrayBuffer): string {
		const content = this.decoder.decode(buffer);
		logger.debug(`Decoded content, length: ${content.length} characters`);
		return content;
	}

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
	protected isNetworkError(message: string): boolean {
		return (
			message.includes("Failed to fetch") || message.includes("Network")
		);
	}

	/**
	 * Format HTTP error into user-friendly Japanese message.
	 *
	 * @param error - HttpError instance
	 * @returns Formatted error message
	 */
	protected formatHttpError(error: HttpError): string {
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
