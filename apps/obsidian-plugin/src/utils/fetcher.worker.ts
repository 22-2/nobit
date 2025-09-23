import type { HttpFetcher } from "@nobit/libch/core/fetcher";
import { DefaultBBSProvider } from "@nobit/libch/providers/DefaultBBSProvider";
import type { PostData } from "@nobit/ui/types.ts";
import * as Comlink from "comlink";

/**
 * A class that wraps the DefaultBBSProvider and is exposed to the main thread via Comlink.
 * This allows the main thread to instantiate this class in the worker and call its methods.
 */
class BBSProviderWorker {
    private provider: DefaultBBSProvider;

    constructor(fetcher: HttpFetcher) {
        // The fetcher is proxied from the main thread by Comlink
        this.provider = new DefaultBBSProvider(fetcher);
    }

    getThreads(boardUrl: string) {
        return this.provider.getThreads(boardUrl);
    }

    getBoardTitle(boardUrl: string) {
        return this.provider.getBoardTitle(boardUrl);
    }

    getThread(threadUrl: string) {
        return this.provider.getThread(threadUrl);
    }

    post(
        threadUrl: string,
        postData: PostData,
        headers?: Record<string, string>,
        confirmationData?: Record<string, string>
    ) {
        return this.provider.post(
            threadUrl,
            postData,
            headers,
            confirmationData
        );
    }

    getBBSMenu(menuUrl: string) {
        return this.provider.getBBSMenu(menuUrl);
    }
}

Comlink.expose(BBSProviderWorker);

export type { BBSProviderWorker };
