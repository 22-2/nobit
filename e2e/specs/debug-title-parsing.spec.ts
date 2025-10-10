import { expect, test } from "../base";
import { BaseTestSetup, DEFAULT_TEST_CONFIG } from "../helpers/BaseTestSetup";

/**
 * Debug Title Parsing Tests
 * Refactored following SOLID principles
 */
test.describe("Debug Title Parsing", () => {
	test("should parse title correctly from DAT format", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);

		await setup.setupBasicThread();

		const debugInfo = await vault.window.evaluate(() => {
			const activeLeaf = app.workspace.activeLeaf;
			if (activeLeaf && activeLeaf.view.getViewType() === "thread-view") {
				const threadView = activeLeaf.view as any;
				const thread = threadView.threadManager.thread;

				return {
					threadTitle: thread?.title,
					firstPostContent: thread?.posts?.[0]?.content,
					firstPostRaw: thread?.posts?.[0],
					titleElText: threadView.titleEl?.innerText,
					getDisplayText: threadView.getDisplayText(),
				};
			}
			return null;
		});

		console.log("🔍 Debug info:", JSON.stringify(debugInfo, null, 2));

		expect(debugInfo?.threadTitle).toBe("基本テストスレッド");
	});
});

test.use(DEFAULT_TEST_CONFIG);
