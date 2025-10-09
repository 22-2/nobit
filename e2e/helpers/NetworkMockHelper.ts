import type { Page, Route } from "@playwright/test";
import type { MockResponse } from "./MockDataFactory";

/**
 * ネットワークモックを管理するヘルパークラス
 * Single Responsibility: ネットワークモックの設定のみを担当
 */
export class NetworkMockHelper {
	private requestCount = 0;
	private requestUrls: string[] = [];

	constructor(private readonly page: Page) {}

	/**
	 * 基本的なルートモックを設定
	 */
	async setupBasicRoute(
		pattern: string,
		response: MockResponse
	): Promise<void> {
		await this.page.route(pattern, (route) => {
			this.requestCount++;
			this.requestUrls.push(route.request().url());
			route.fulfill(response);
		});
	}

	/**
	 * 条件付きルートモックを設定
	 */
	async setupConditionalRoute(
		urlMatcher: (url: string) => boolean,
		response: MockResponse
	): Promise<void> {
		await this.page.route("**/*", async (route: Route) => {
			const url = route.request().url();

			if (urlMatcher(url)) {
				this.requestCount++;
				this.requestUrls.push(url);
				await route.fulfill(response);
			} else {
				await route.continue();
			}
		});
	}

	/**
	 * リクエストカウントをリセット
	 */
	resetRequestCount(): void {
		this.requestCount = 0;
		this.requestUrls = [];
	}

	/**
	 * リクエスト統計を取得
	 */
	getRequestStats(): RequestStats {
		return {
			count: this.requestCount,
			urls: [...this.requestUrls],
		};
	}

	/**
	 * ルートをクリア
	 */
	async clearRoutes(pattern: string): Promise<void> {
		await this.page.unroute(pattern);
	}
}

export interface RequestStats {
	count: number;
	urls: string[];
}
