// E:\Desktop\coding\pub\obsidian-sandbox-note\e2e\specs\setup\example.spec.ts
import { VIEW_TYPE_THREAD } from "src/utils/constants";
import "../setup/logger-setup";
// ===================================================================
// Example Test (example.test.mts)
// ===================================================================

import { expect, test } from "../base";
import { DIST_DIR, PLUGIN_ID, SANDBOX_VAULT_NAME } from "../constants";
import { ObsidianPageObject } from "../helpers/ObsidianPageObject"; // Import ObsidianPageObject

test("sandbox test: plugin activation and view creation via command", async ({
	vault,
}) => {
	// Instantiate ObsidianPageObject
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);

	if (!process.env.CI) {
		// 1. Initial setup verification
		// Verify Vault name
		const vaultName = await vault.window.evaluate(() => app.vault.getName());
		expect(vaultName).toBe(SANDBOX_VAULT_NAME);
	}

	// Verify plugin activation
	expect(
		await vault.window.evaluate(
			(pluginId) => app.plugins.getPlugin(pluginId),
			PLUGIN_ID,
		),
	).toBeTruthy();

	// 2. Create a new sandbox view (via command)
	// Use ObsidianPageObject method
	await obsPage.openPluginWithURL(
		PLUGIN_ID,
		"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
	);

	// 3. Verify the view opened correctly
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);
	await obsPage.expectActiveTabType(VIEW_TYPE_THREAD);
});

// Custom settings are maintained
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
