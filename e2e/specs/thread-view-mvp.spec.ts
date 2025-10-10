import { expect, test } from "../base";
import { PLUGIN_ID } from "../constants";
import { BaseTestSetup, DEFAULT_TEST_CONFIG } from "../helpers/BaseTestSetup";

/**
 * Thread View MVP Tests
 * Refactored following SOLID principles
 */
test.describe("Thread View MVP Tests", () => {
	test("should open ThreadView via command", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);

		const plugin = await vault.window.evaluate(
			(pluginId) => app.plugins.getPlugin(pluginId),
			PLUGIN_ID,
		);
		expect(plugin).toBeTruthy();

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);

		await setup.getThreadPage().verifyBasicUIStructure();

		const postCount = await setup.getThreadPage().getPostCount();
		expect(postCount).toBeGreaterThan(0);

		await setup.getThreadPage().expectErrorState(false);
		await setup.getThreadPage().expectLoadingState(false);
	});

	test("should display UI structure correctly", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);
		await setup.getThreadPage().verifyBasicUIStructure();

		await expect(
			vault.window.locator(".toolbar-section .clickable-icon"),
		).toBeVisible();

		await setup.getThreadPage().expectErrorState(false);
		await setup.getThreadPage().expectLoadingState(false);
	});

	test("should support Svelte 5 reactivity", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);

		await expect(vault.window.locator(".thread-filters")).toBeVisible();
		await expect(vault.window.locator(".filter-buttons-group")).toBeVisible();
		await expect(vault.window.locator(".thread-title")).toBeVisible();
		await expect(vault.window.locator(".post-count")).toContainText("posts");

		const postCount = await setup.getThreadPage().getPostCount();
		expect(postCount).toBeGreaterThan(0);

		await expect(
			vault.window.locator(".toolbar-section .clickable-icon"),
		).toBeVisible();
	});

	test("should maintain architectural separation", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);

		await expect(vault.window.locator(".thread-view")).toBeVisible();
		await expect(vault.window.locator(".thread-filters")).toBeVisible();
		await expect(vault.window.locator(".posts-container")).toBeVisible();
		await expect(vault.window.locator(".thread-title")).toBeVisible();
		await expect(vault.window.locator(".post-count")).toContainText("posts");
		await expect(vault.window.locator(".toolbar-section")).toBeVisible();
		await expect(vault.window.locator(".filters-section")).toBeVisible();
	});

	test("should validate basic UI structure", async ({ vault }) => {
		const setup = new BaseTestSetup(vault);

		await setup.setupBasicThread(
			"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/",
		);

		await expect(vault.window.locator(".thread-view")).toBeVisible();
		await expect(vault.window.locator(".filters-section")).toBeVisible();
		await expect(vault.window.locator(".toolbar-section")).toBeVisible();
		await expect(vault.window.locator(".thread-header")).toBeVisible();
		await expect(vault.window.locator(".thread-title")).toBeVisible();
		await expect(vault.window.locator(".posts-container")).toBeVisible();

		const postCount = await setup.getThreadPage().getPostCount();
		expect(postCount).toBeGreaterThan(0);

		await expect(
			vault.window.locator(".toolbar-section .clickable-icon"),
		).toBeVisible();
		await expect(vault.window.locator(".thread-filters")).toBeVisible();
		await expect(vault.window.locator(".filter-buttons-group")).toBeVisible();
	});
});

test.use(DEFAULT_TEST_CONFIG);
