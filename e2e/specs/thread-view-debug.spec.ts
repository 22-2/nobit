import { VIEW_TYPE_THREAD } from "../../src/utils/constants";
import { expect, test } from "../base";
import { DIST_DIR, PLUGIN_ID, SANDBOX_VAULT_NAME } from "../constants";
import { ObsidianPageObject } from "../helpers/ObsidianPageObject";

const CMD_ID_OPEN_THREAD_VIEW = "nobit:open-nobit-test-thread";

test("Debug: Check what's actually rendered", async ({ vault }) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);

	// 1. Verify initial setup
	const vaultName = await vault.window.evaluate(() => app.vault.getName());
	expect(vaultName).toBe(SANDBOX_VAULT_NAME);

	// Verify plugin is activated
	const plugin = await vault.window.evaluate(
		(pluginId) => app.plugins.getPlugin(pluginId),
		PLUGIN_ID
	);
	expect(plugin).toBeTruthy();

	// 2. Execute command
	await obsPage.runCommand(CMD_ID_OPEN_THREAD_VIEW);

	// 3. Verify ThreadView opened
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);
	await obsPage.expectActiveTabType(VIEW_TYPE_THREAD);

	// 4. Check for JavaScript errors
	const errors: string[] = [];
	vault.window.on("console", (msg) => {
		if (msg.type() === "error") {
			errors.push(msg.text());
		}
	});

	// 5. Wait a moment for Svelte component to mount
	await vault.window.waitForTimeout(2000);

	// 6. Debug: Check what's actually in the content
	const contentHTML = await vault.window.evaluate(() => {
		const activeLeaf = app.workspace.activeLeaf;
		if (activeLeaf && activeLeaf.view.getViewType() === "thread-view") {
			return (activeLeaf.view as any).contentEl.innerHTML;
		}
		return "No thread view found";
	});

	console.log("Content HTML:", contentHTML.length);
	console.log("JavaScript errors:", errors);

	// 7. Check for any elements in the content
	const hasAnyContent = await vault.window.evaluate(() => {
		const activeLeaf = app.workspace.activeLeaf;
		if (activeLeaf && activeLeaf.view.getViewType() === "thread-view") {
			return (activeLeaf.view as any).contentEl.children.length > 0;
		}
		return false;
	});

	console.log("Has any content:", hasAnyContent);

	// 8. Check if the component property exists
	const componentExists = await vault.window.evaluate(() => {
		const activeLeaf = app.workspace.activeLeaf;
		if (activeLeaf && activeLeaf.view.getViewType() === "thread-view") {
			return !!(activeLeaf.view as any).component;
		}
		return false;
	});

	console.log("Component exists:", componentExists);

	// 9. Check for specific classes
	const hasThreadView = await vault.window.locator(".thread-view").count();
	const hasAnyDiv = await vault.window.locator("div").count();

	console.log("Thread view elements:", hasThreadView);
	console.log("Total div elements:", hasAnyDiv);
});

// Custom test configuration
test.use({
	vaultOptions: {
		useSandbox: true,
		plugins: [
			{
				path: DIST_DIR,
				pluginId: PLUGIN_ID,
			},
		],
	},
});
