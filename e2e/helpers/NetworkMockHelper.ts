import type { Page, Route } from "@playwright/test";
import type { MockResponse } from "./MockDataFactory";

/**
 * ネットワークモックを管理するヘルパークラス
 * Single Responsibility: ネットワークモックの設定のみを担当
 */
export class NetworkMockHelper {
	private requestCount = 0;
	private requestUrls: string[] = [];

	constructor(private readonly page: Page) {
		// Log all requests for debugging
		this.page.on("request", (request) => {
			if (request.url().includes(".dat")) {
				console.log(`📡 Request detected: ${request.url()}`);
			}
		});
	}

	/**
	 * 基本的なルートモックを設定
	 */
	async setupBasicRoute(
		pattern: string,
		response: MockResponse,
	): Promise<void> {
		console.log(`🔧 Setting up route for pattern: ${pattern}`);

		await this.page.route(pattern, async (route) => {
			this.requestCount++;
			this.requestUrls.push(route.request().url());
			console.log(`🎯 Mock intercepted: ${route.request().url()}`);

			// Ensure body is a string or Buffer
			const body =
				typeof response.body === "string"
					? response.body
					: response.body.toString();

			// Use headers instead of contentType
			await route.fulfill({
				status: response.status,
				headers: {
					"Content-Type": response.contentType,
				},
				body: body,
			});
			console.log(
				`✅ Mock fulfilled with status ${response.status}, body length: ${body.length}`,
			);
		});

		console.log(`✅ Route setup complete for pattern: ${pattern}`);
	}

	/**
	 * 条件付きルートモックを設定
	 */
	async setupConditionalRoute(
		urlMatcher: (url: string) => boolean,
		response: MockResponse,
	): Promise<void> {
		await this.page.route("**/*", async (route: Route) => {
			const url = route.request().url();

			if (urlMatcher(url)) {
				this.requestCount++;
				this.requestUrls.push(url);

				// Ensure body is a string or Buffer
				const body =
					typeof response.body === "string"
						? response.body
						: response.body.toString();

				await route.fulfill({
					status: response.status,
					headers: {
						"Content-Type": response.contentType,
					},
					body: body,
				});
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
