import { test as base, type TestInfo } from "@playwright/test"; // TestInfo をインポート
import log from "loglevel";
import type { VaultOptions } from "./helpers/types";
import { type VaultPageTextContext } from "./helpers/types";
import { ObsidianTestSetup } from "./setup/ObsidianTestSetup";

// TestInfo をフィクスチャの型定義に追加
type TestFixtures = {
	obsidianSetup: ObsidianTestSetup;
	vault: VaultPageTextContext;
	vaultOptions: VaultOptions;
};
type WorkerFixtures = {
	testInfo: TestInfo; // これを明示的に書く必要はないが、わかりやすさのため
};

const logger = log.getLogger("obsidianSetup");

export const test = base.extend<TestFixtures, WorkerFixtures>({
	vaultOptions: {
		useSandbox: true,
		showLoggerOnNode: true,
		plugins: [],
	},

	// testInfo をフィクスチャの引数として受け取る
	obsidianSetup: async ({}, use, testInfo) => {
		const setup = new ObsidianTestSetup();

		try {
			logger.debug("launch");
			await setup.launch();
			logger.debug("done");
			logger.debug("enter tests");

			// テスト本体を実行
			await use(setup);

			// `use` の後にテストステータスを確認
			if (testInfo.status !== "passed" && testInfo.status !== "skipped") {
				// テストが失敗、またはタイムアウトした場合
				logger.error(
					`Test finished with status: ${testInfo.status}. Pausing for debug.`
				);

				// エラーメッセージをカラー付きで出力する
				if (testInfo.error) {
					console.error(
						"\n" + "=".repeat(20) + " TEST FAILED " + "=".repeat(20)
					);
					// Playwrightが生成したカラー付きのエラーメッセージを直接コンソールに出力
					console.error(testInfo.error.message);
					if (testInfo.error.stack) {
						// スタックトレースも出力（多くの場合 message に含まれるが、念のため）
						// messageと重複する部分を避けるためにstackからmessageを削除する
						const stackWithoutMessage =
							testInfo.error.stack.substring(
								testInfo.error.stack.indexOf("\n") + 1
							);
						console.error(stackWithoutMessage);
					}
					console.error("=".repeat(53) + "\n");
				}

				if (!process.env.CI) {
					logger.debug(testInfo.errors);
					await setup.getCurrentPage()?.pause();
				}
				// エラーログをより詳細に出力
				if (testInfo.error) {
					logger.error("Test error:", testInfo.error);
				}
			} else {
				logger.debug(`Test finished with status: ${testInfo.status}.`);
			}
		} catch (err: any) {
			// フィクスチャ自体のセットアップ中にエラーが発生した場合
			logger.error(`Error during fixture setup: ${err.message || err}`);
			if (!process.env.CI) {
				await setup.getCurrentPage()?.pause();
			}
			throw err;
		} finally {
			// クリーンアップは常に行う
			logger.debug("clean up app");
			await setup.cleanup();
			logger.debug("ok");
		}
	},

	vault: async ({ obsidianSetup, vaultOptions }, use) => {
		// ... (vault フィクスチャは変更なし)
		logger.debug("vaultOptions", vaultOptions);
		const context = vaultOptions.useSandbox
			? await obsidianSetup.openSandbox(vaultOptions)
			: await obsidianSetup.openVault(vaultOptions);

		if (vaultOptions.showLoggerOnNode) {
			logger.debug("enable browser console");

			// Enhanced console logging with more details
			context.window.on("console", (msg) => {
				const type = msg.type();
				const fullText = msg.text();

				// 長文（500文字以上）は抑制
				if (fullText.length > 500) {
					console.log(`🖥️ BROWSER [${type.toUpperCase()}]: [長文のため省略: ${fullText.length}文字]`);
					return;
				}

				const text = fullText.substring(0, 100);
				const location = msg.location();

				console.log(`🖥️ BROWSER [${type.toUpperCase()}]: ${text}`);
				if (location.url && location.url !== "about:blank") {
					console.log(
						`   📍 Location: ${location.url}:${location.lineNumber}:${location.columnNumber}`
					);
				}

				// Show args for more complex console calls
				const args = msg.args();
				if (args.length > 1) {
					console.log(`   📋 Args: ${args.length} arguments`);
				}
			});

			// Listen to page errors
			context.window.on("pageerror", (error) => {
				console.log(`🖥️ PAGE ERROR: ${error.message}`);
				if (error.stack) {
					console.log(`   📚 Stack: ${error.stack}`);
				}
			});

			// Listen to request failures
			context.window.on("requestfailed", (request) => {
				console.log(`🖥️ REQUEST FAILED: ${request.url()}`);
				const failure = request.failure();
				if (failure) {
					console.log(`   ❌ Failure: ${failure.errorText}`);
				}
			});

			// Listen to response errors
			context.window.on("response", (response) => {
				if (!response.ok()) {
					console.log(
						`🖥️ HTTP ERROR: ${response.status()} ${response.statusText()} - ${response.url()}`
					);
				}
			});
		}
		const notices = await context.window
			.locator(".notice-container .notice")
			.all();

		logger.debug("remove all notices");
		await Promise.all(
			notices.map(async (notice) => {
				await notice.click();
			})
		);
		logger.debug("enter test");
		await use(context);
		logger.debug("done");
	},
});

export { expect } from "@playwright/test";

