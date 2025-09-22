import { requestUrl, type RequestUrlParam } from "obsidian";
import { invariant } from "./tiny-errors";
import { sleep } from "./wait";
import { type HttpFetcher, HttpError } from "@nobit/libch/core/fetcher";
import log from "loglevel";

type QueuedRequest = {
    params: RequestUrlParam;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
};

export class ObsidianFetcher implements HttpFetcher {
    private requestQueue: QueuedRequest[] = [];
    private isProcessing = false;
    private readonly delay: number;

    constructor(delay = 300) {
        this.delay = delay;
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }
        this.isProcessing = true;

        const request = this.requestQueue.shift();
        if (!request) {
            this.isProcessing = false;
            return;
        }

        try {
            console.log(request);
            console.log(`Fetching URL: ${request.params.url}`, request.params);
            const response = await requestUrl(request.params);
            console.log(`Response for URL ${request.params.url}:`, response);

            request.resolve(response.arrayBuffer);
        } catch (error: any) {
            if (error && typeof error.status === "number") {
                request.reject(
                    new HttpError(
                        `Obsidian requestUrl failed with status ${error.status} for URL: ${request.params.url}`,
                        error.status,
                        new Response(null, { status: error.status })
                    )
                );
            } else {
                request.reject(error);
            }
        } finally {
            await sleep(this.delay);
            this.isProcessing = false;
            this.processQueue();
        }
    }

    private enqueueRequest(params: RequestUrlParam): Promise<any> {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ params, resolve, reject });
            this.processQueue();
        });
    }

    async fetch(
        url: string,
        headers?: Record<string, string>
    ): Promise<ArrayBuffer> {
        const options: RequestUrlParam = {
            url,
            headers,
        };
        invariant(
            !url.includes("://undefined/"),
            "url includes undefined",
            () => log.debug("invalid url", url)
        );
        return this.enqueueRequest(options);
    }

    async post(
        url: string,
        body: URLSearchParams,
        headers?: Record<string, string>,
        confirmationData?: Record<string, string>
    ): Promise<ArrayBuffer> {
        const options: RequestUrlParam = {
            url,
            method: "POST",
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            body: body.toString(),
            headers: headers,
        };
        return this.enqueueRequest(options);
    }
}
