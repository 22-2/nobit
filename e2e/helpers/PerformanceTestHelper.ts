import type { Page } from "@playwright/test";

/**
 * パフォーマンステスト用のヘルパークラス
 * Single Responsibility: パフォーマンス測定のみを担当
 */
export class PerformanceTestHelper {
	constructor(private readonly page: Page) {}

	/**
	 * 処理時間を測定
	 */
	async measureExecutionTime(action: () => Promise<void>): Promise<number> {
		const startTime = Date.now();
		await action();
		return Date.now() - startTime;
	}

	/**
	 * メモリ使用量を取得
	 */
	async getMemoryUsage(): Promise<number> {
		return await this.page.evaluate(() => {
			if ("memory" in performance) {
				return (performance as any).memory.usedJSHeapSize;
			}
			return 0;
		});
	}

	/**
	 * スクロールパフォーマンスを測定
	 */
	async measureScrollPerformance(
		selector: string,
	): Promise<ScrollPerformanceResult> {
		const startTime = Date.now();

		const container = this.page.locator(selector);

		// 下にスクロール
		await container.evaluate((el) => {
			el.scrollTop = el.scrollHeight;
		});
		await this.page.waitForTimeout(100);

		// 中央にスクロール
		await container.evaluate((el) => {
			el.scrollTop = el.scrollHeight / 2;
		});
		await this.page.waitForTimeout(100);

		// 上にスクロール
		await container.evaluate((el) => {
			el.scrollTop = 0;
		});

		const totalTime = Date.now() - startTime;

		const scrollTop = await container.evaluate((el) => el.scrollTop);

		return {
			totalTime,
			finalScrollTop: scrollTop,
		};
	}

	/**
	 * メモリリークをチェック
	 */
	async checkMemoryLeak(
		beforeAction: () => Promise<void>,
		action: () => Promise<void>,
		afterAction: () => Promise<void>,
	): Promise<MemoryLeakResult> {
		const initialMemory = await this.getMemoryUsage();

		await beforeAction();
		const afterLoadMemory = await this.getMemoryUsage();

		await action();
		await afterAction();

		// ガベージコレクションを試行
		await this.page.evaluate(() => {
			if ("gc" in window) {
				(window as any).gc();
			}
		});

		await this.page.waitForTimeout(1000);

		const afterCleanupMemory = await this.getMemoryUsage();

		return {
			initialMemory,
			afterLoadMemory,
			afterCleanupMemory,
			memoryIncrease: afterLoadMemory - initialMemory,
			memoryAfterCleanup: afterCleanupMemory - initialMemory,
		};
	}
}

export interface ScrollPerformanceResult {
	totalTime: number;
	finalScrollTop: number;
}

export interface MemoryLeakResult {
	initialMemory: number;
	afterLoadMemory: number;
	afterCleanupMemory: number;
	memoryIncrease: number;
	memoryAfterCleanup: number;
}
