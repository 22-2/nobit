// packages/libch/src/client.ts

// --- 1. ネットワーク処理のインターフェース ---
/**
 * URLからデータをArrayBufferとして取得するための抽象インターフェース。
 */
export interface HttpFetcher {
    fetch(url: string): Promise<ArrayBuffer>;
    post(
        url: string,
        body: URLSearchParams,
        headers?: Record<string, string>,
        confirmationData?: Record<string, string>
    ): Promise<ArrayBuffer>;
}

/**
 * HTTPエラーを表現するためのカスタムエラークラス。
 * ステータスコードを保持します。
 */
export class HttpError extends Error {
    public response: Response;
    constructor(
        message: string,
        public status: number,
        response: Response
    ) {
        super(message);
        this.name = "HttpError";
        this.response = response;
    }
}

/**
 * 標準のfetch APIを使ったHttpFetcherの具体的な実装。
 */
export class DefaultFetcher implements HttpFetcher {
    public async fetch(url: string): Promise<ArrayBuffer> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new HttpError(
                `HTTP error! status: ${response.status} for URL: ${url}`,
                response.status,
                response
            );
        }
        return response.arrayBuffer();
    }

    public async post(
        url: string,
        body: URLSearchParams,
        headers: Record<string, string> = {},
        // confirmationData is not used in DefaultFetcher, but is included for interface compatibility
        confirmationData?: Record<string, string>
    ): Promise<ArrayBuffer> {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                ...headers,
            },
            body: body.toString(),
        });
        if (!response.ok) {
            throw new HttpError(
                `HTTP error! status: ${response.status} for URL: ${url}`,
                response.status,
                response
            );
        }
        return response.arrayBuffer();
    }
}
