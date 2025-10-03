import log from "loglevel";
import { HttpError, type HttpFetcher } from "./libch/fetcher";
import { RequestQueue } from "./RequestQueue";

export const logger = log.getLogger("TestFetcher");

/**
 * Test-specific fetcher that uses standard fetch API instead of Obsidian's requestUrl
 * This allows Playwright routes to intercept requests during e2e testing
 */
export class TestFetcher implements HttpFetcher {
	private queue: RequestQueue;

	constructor(delay = 300) {
		this.queue = new RequestQueue(delay);
	}

	private async executeRequest(
		url: string,
		options?: RequestInit
	): Promise<ArrayBuffer> {
		logger.debug(`Fetching URL: ${url}`, options);

		try {
			const response = await fetch(url, options);
			
			if (!response.ok) {
				throw new HttpError(
					`Test fetch failed with status ${response.status} for URL: ${url}`,
					response.status,
					response
				);
			}

			const arrayBuffer = await response.arrayBuffer();
			logger.debug(`Response for URL ${url}:`, {
				status: response.status,
				headers: Object.fromEntries(response.headers.entries()),
				arrayBuffer,
				json: undefined,
				text: undefined
			});
			
			return arrayBuffer;
		} catch (error: any) {
			if (error instanceof HttpError) {
				throw error;
			}
			
			// Handle network errors
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