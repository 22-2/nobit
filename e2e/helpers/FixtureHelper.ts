import type { Page } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * フィクスチャファイル管理のヘルパークラス
 * Single Responsibility: フィクスチャファイルの読み込みと管理のみを担当
 */
export class FixtureHelper {
	private static readonly FIXTURES_DIR = join(
		process.cwd(),
		"src/__tests__/fixtures",
	);

	/**
	 * フィクスチャファイルのパスを取得
	 */
	static getFixturePath(filename: string): string {
		return join(this.FIXTURES_DIR, filename);
	}

	/**
	 * フィクスチャファイルを読み込む
	 */
	static loadFixture(filename: string): Buffer {
		const path = this.getFixturePath(filename);
		return readFileSync(path);
	}

	/**
	 * フィクスチャルートを設定
	 */
	static async setupFixtureRoute(
		page: Page,
		fixturePath: string,
		urlPattern: string,
	): Promise<void> {
		console.log(`🔧 Setting up fixture route with file: ${fixturePath}`);

		await page.route("**/*", async (route: any) => {
			const url = route.request().url();

			if (url.includes(urlPattern)) {
				console.log(`🎯 MATCHING TARGET URL: ${url}`);

				try {
					const buffer = readFileSync(fixturePath);

					console.log(
						`📁 Serving fixture file: ${fixturePath} (${buffer.length} bytes)`,
					);

					await route.fulfill({
						status: 200,
						contentType: "text/html; charset=Shift_JIS",
						body: buffer,
					});
					console.log(`✅ Successfully served fixture file`);
					return;
				} catch (error) {
					console.error("❌ Failed to load fixture file in route:", error);
					await route.fulfill({
						status: 500,
						body: "Failed to load fixture",
					});
					return;
				}
			} else {
				await route.continue();
			}
		});
	}
}

/**
 * 定義済みフィクスチャのパス
 */
export const FIXTURES = {
	SMALL: FixtureHelper.getFixturePath("1759320900.dat"),
	LARGE: FixtureHelper.getFixturePath("1759470805.1000posts.dat"),
} as const;
