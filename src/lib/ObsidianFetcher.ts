import log from "loglevel";
import { requestUrl, type RequestUrlParam } from "obsidian";
import { HttpError, type HttpFetcher } from "./libch/fetcher";
import { RequestQueue } from "./RequestQueue";

export const logger = log.getLogger("ObsidianFetcher");

export class ObsidianFetcher implements HttpFetcher {
	private queue: RequestQueue;

	constructor(delay = 300) {
		this.queue = new RequestQueue(delay);
	}

	private async executeRequest(
		params: RequestUrlParam,
	): Promise<ArrayBuffer> {
		logger.debug(`Fetching URL: ${params.url}`, params);

		try {
			const response = await requestUrl(params);
			logger.debug(`Response for URL ${params.url}:`, response);
			return response.arrayBuffer;
		} catch (error: any) {
			if (error && typeof error.status === "number") {
				throw new HttpError(
					`Obsidian requestUrl failed with status ${error.status} for URL: ${params.url}`,
					error.status,
					new Response(null, { status: error.status }),
				);
			}
			throw error;
		}
	}

	async fetch(
		url: string,
		headers?: Record<string, string>,
	): Promise<ArrayBuffer> {
		const options: RequestUrlParam = {
			url,
			headers,
		};
		return this.queue.enqueue(() => this.executeRequest(options));
	}

	async post(
		url: string,
		body: URLSearchParams,
		headers?: Record<string, string>,
		confirmationData?: Record<string, string>,
	): Promise<ArrayBuffer> {
		const options: RequestUrlParam = {
			url,
			method: "POST",
			contentType: "application/x-www-form-urlencoded; charset=UTF-8",
			body: body.toString(),
			headers: headers,
		};
		return this.queue.enqueue(() => this.executeRequest(options));
	}
}
