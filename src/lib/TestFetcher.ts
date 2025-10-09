import log from "loglevel";
import { HttpError, type HttpFetcher } from "./libch/fetcher";
import { RequestQueue } from "./RequestQueue";

export const logger = log.getLogger("TestFetcher");

/**
 * Mock response handler type
 */
export type MockHandler = (url: string) => { status: number; body: string } | null;

/**
 * Test-specific fetcher that uses standard fetch API instead of Obsidian's requestUrl
 * This allows Playwright routes to intercept requests during e2e testing
 * Also supports direct mocking for more reliable test behavior
 */
export class TestFetcher implements HttpFetcher {
	private queue: RequestQueue;
	private static mockHandler: MockHandler | null = null;

	constructor(delay = 300) {
		this.queue = new RequestQueue(delay);
	}

	/**
	 * Set a global mock handler for all TestFetcher instances
	 */
	static setMockHandler(handler: MockHandler | null): void {
		TestFetcher.mockHandler = handler;
		logger.debug('Mock handler set:', !!handler);
	}

	/**
	 * Clear the global mock handler
	 */
	static clearMockHandler(): void {
		TestFetcher.mockHandler = null;
		logger.debug('Mock handler cleared');
	}

	private async executeRequest(
		url: string,
		options?: RequestInit
	): Promise<ArrayBuffer> {
		logger.debug(`Fetching URL: ${url}`, options);

		// Check for mock handler first
		if (TestFetcher.mockHandler) {
			const mockResponse = TestFetcher.mockHandler(url);
			if (mockResponse) {
				logger.debug(`🎯 Using mock response for ${url}`, {
					status: mockResponse.status,
					bodyLength: mockResponse.body.length,
				});

				if (mockResponse.status !== 200) {
					throw new HttpError(
						`Mock fetch failed with status ${mockResponse.status} for URL: ${url}`,
						mockResponse.status,
						null as any
					);
				}

				// Convert string to ArrayBuffer
				const encoder = new TextEncoder();
				const arrayBuffer = encoder.encode(mockResponse.body).buffer;
				logger.debug(`✅ Mock response returned, size: ${arrayBuffer.byteLength}`);
				return arrayBuffer;
			}
		}

		try {
			const response = await fetch(url, options);

			logger.debug(`Response received for ${url}:`, {
				status: response.status,
				ok: response.ok,
				statusText: response.statusText,
				headers: Object.fromEntries(response.headers.entries()),
			});

			if (!response.ok) {
				throw new HttpError(
					`Test fetch failed with status ${response.status} for URL: ${url}`,
					response.status,
					response
				);
			}

			const arrayBuffer = await response.arrayBuffer();
			logger.debug(`ArrayBuffer received, size: ${arrayBuffer.byteLength}`);

			return arrayBuffer;
		} catch (error: any) {
			if (error instanceof HttpError) {
				throw error;
			}

			// Handle network errors
			logger.error(`Network error fetching ${url}:`, error);
			throw new Error(`Network error fetching ${url}: ${error.message}`);
		}
	}

	async fetch(
		url: string,
		headers?: Record<string, string>
	): Promise<ArrayBuffer> {
		const options: RequestInit = {
			method: 'GET',
			headers,
		};
		return this.queue.enqueue(() => this.executeRequest(url, options));
	}

	async post(
		url: string,
		body: URLSearchParams,
		headers?: Record<string, string>,
		confirmationData?: Record<string, string>
	): Promise<ArrayBuffer> {
		const options: RequestInit = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
				...headers,
			},
			body: body.toString(),
		};
		return this.queue.enqueue(() => this.executeRequest(url, options));
	}
}
