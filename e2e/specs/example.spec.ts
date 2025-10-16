import { expect, test } from "../base";
import { PLUGIN_ID, SANDBOX_VAULT_NAME, VIEW_TYPE_THREAD } from "../constants";
import { BaseTestSetup, DEFAULT_TEST_CONFIG } from "../helpers/BaseTestSetup";
import "../setup/logger-setup";

/**
 * Example Test
 * Refactored following SOLID principles
 */
test("sandbox test: plugin activation and view creation via command", async ({
	vault,
}) => {
	const setup = new BaseTestSetup(vault);

	if (!process.env.CI) {
		const vaultName = await vault.window.evaluate(() => app.vault.getName());
		expect(vaultName).toBe(SANDBOX_VAULT_NAME);
	}

	expect(
		await vault.window.evaluate(
			(pluginId) => app.plugins.getPlugin(pluginId),
			PLUGIN_ID,
		),
	).toBeTruthy();

	await setup
		.getThreadPage()
		.openPluginWithURL(
			PLUGIN_ID,
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);

	await setup.getThreadPage().expectViewCount(VIEW_TYPE_THREAD, 1);
	await setup.getThreadPage().expectActiveTabType(VIEW_TYPE_THREAD);
});

test.use(DEFAULT_TEST_CONFIG);
