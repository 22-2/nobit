import type { BBSProvider } from "@nobit/libch/core/provider";
import type { Thread } from "@nobit/libch/core/types";
import { parseBbsUrl } from "@nobit/libch/core/url";
import type {
    SubjectItem,
    PostData,
    PostResult,
    BBSMenu,
} from "@nobit/ui/types.ts";
import type { BBSProviderWorker } from "./fetcher.worker";
// @ts-expect-error
import FetcherWorker from "./fetcher.worker";
import * as Comlink from "comlink";
import { ObsidianFetcher } from "./client";

export class WorkerBBSProvider implements BBSProvider {
    id = "5ch-compat";
    name = "5ch互換プロパイダ";

    private worker: Worker;
    private remoteProvider?: Comlink.Remote<BBSProviderWorker>;
    private RemoteBBSProvider?: Comlink.Remote<typeof BBSProviderWorker>;

    constructor() {
        this.worker = new FetcherWorker();
    }

    public async initialize(): Promise<void> {
        const fetcher = new ObsidianFetcher();
        this.RemoteBBSProvider = Comlink.wrap<typeof BBSProviderWorker>(
            this.worker
        );
        this.remoteProvider = await new this.RemoteBBSProvider(
            Comlink.proxy(fetcher)
        );
    }

    private async getProvider(): Promise<Comlink.Remote<BBSProviderWorker>> {
        if (!this.remoteProvider) {
            await this.initialize();
        }
        return this.remoteProvider!;
    }

    canHandleUrl(url: string): boolean {
        return !!parseBbsUrl(url);
    }

    async getThreads(boardUrl: string): Promise<SubjectItem[]> {
        const p = await this.getProvider();
        return p.getThreads(boardUrl);
    }

    async getBoardTitle(boardUrl: string): Promise<string> {
        const p = await this.getProvider();
        return p.getBoardTitle(boardUrl);
    }

    async getThread(threadUrl: string): Promise<Thread> {
        const p = await this.getProvider();
        return p.getThread(threadUrl);
    }

    async post(
        threadUrl: string,
        postData: PostData,
        headers?: Record<string, string>,
        confirmationData?: Record<string, string>
    ): Promise<PostResult> {
        const p = await this.getProvider();
        return p.post(threadUrl, postData, headers, confirmationData);
    }

    async getBBSMenu(menuUrl: string): Promise<BBSMenu> {
        const p = await this.getProvider();
        return p.getBBSMenu(menuUrl);
    }

    terminate(): void {
        if (this.remoteProvider) {
            this.remoteProvider[Comlink.releaseProxy]();
        }
        this.worker.terminate();
    }
}
