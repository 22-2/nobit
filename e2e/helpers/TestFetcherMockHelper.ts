import type { Page } from "@playwright/test";
import type { MockHandler } from "../../src/lib/TestFetcher";

/**
 * Helper to set up TestFetcher mocks from Playwright tests
 */
export class TestFetcherMockHelper {
	constructor(private readonly page: Page) {}

	/**
	 * Set up a mock handler in the browser context
	 */
	async setupMock(handler: MockHandler): Promise<void> {
		await this.page.evaluate((handlerStr) => {
			// Access TestFetcher from the global scope
			const TestFetcher = (window as any).TestFetcher;
			if (!TestFetcher) {
				console.error('❌ TestFetcher not found in global scope');
				return;
			}

			// Create the handler function from string
			const handlerFn = new Function('url', handlerStr) as MockHandler;
			TestFetcher.setMockHandler(handlerFn);
			console.log('✅ TestFetcher mock handler set');
		}, handler.toString());
	}

	/**
	 * Set up a simple URL pattern matcher
	 */
	async setupPatternMock(pattern: string | RegExp, response: { status: number; body: string }): Promise<void> {
		const patternStr = pattern instanceof RegExp ? pattern.source : pattern;
		const isRegex = pattern instanceof RegExp;

		await this.page.evaluate(
			({ patternStr, isRegex, response }) => {
				const TestFetcher = (window as any).TestFetcher;
				if (!TestFetcher) {
					console.error('❌ TestFetcher not found in global scope');
					return;
				}

				const matcher = isRegex ? new RegExp(patternStr) : patternStr;

				TestFetcher.setMockHandler((url: string) => {
					const matches = typeof matcher === 'string'
						? url.includes(matcher)
						: matcher.test(url);

					if (matches) {
						console.log(`🎯 TestFetcher mock matched: ${url}`);
						return response;
					}
					return null;
				});

				console.log('✅ TestFetcher pattern mock set:', patternStr);
			},
			{ patternStr, isRegex, response }
		);
	}

	/**
	 * Clear all mocks
	 */
	async clearMocks(): Promise<void> {
		await this.page.evaluate(() => {
			const TestFetcher = (window as any).TestFetcher;
			if (TestFetcher) {
				TestFetcher.clearMockHandler();
				console.log('✅ TestFetcher mocks cleared');
			}
		});
	}
}
