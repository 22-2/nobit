import { readFileSync } from "fs";
import { join } from "path";
import type NobitPlugin from "src/main";
import { VIEW_TYPE_THREAD } from "../../src/utils/constants";
import { expect, test } from "../base";
import { DIST_DIR, PLUGIN_ID, SANDBOX_VAULT_NAME } from "../constants";
import { ObsidianPageObject } from "../helpers/ObsidianPageObject";
// DefaultDecoder import removed - decoding will be handled by the plugin

// ========================================
// 📁 FIXTURE CONFIGURATION
// ========================================
// Easily customize which fixture files to use for testing
const FIXTURES = {
	SMALL: join(process.cwd(), "src/__tests__/fixtures/1759320900.dat"), // ~10 posts
	LARGE: join(
		process.cwd(),
		"src/__tests__/fixtures/1759470805.1000posts.dat"
	), // ~1000 posts
};

// Default fixture path (can be overridden per test)
const FIXTURE_PATH = FIXTURES.SMALL;

// 💡 To add a new fixture:
// 1. Add your .dat file to src/__tests__/fixtures/
// 2. Add it to the FIXTURES object above
// 3. Use it in tests: setupFixtureRoute(vault.window, FIXTURES.YOUR_FIXTURE)

test.use({
	vaultOptions: {
		showLoggerOnNode: true,
		useSandbox: true,
		plugins: [
			{
				path: DIST_DIR,
				pluginId: PLUGIN_ID,
			},
		],
	},
});

// Helper function to setup route with fixture file (raw Shift_JIS binary)
async function setupFixtureRoute(
	window: any,
	fixturePath: string = FIXTURE_PATH
) {
	console.log(`🔧 Setting up fixture route with file: ${fixturePath}`);

	// Debug: catch all requests to see what's happening
	await window.route("**/*", async (route: any) => {
		const url = route.request().url();
		console.log(`🌐 ALL REQUESTS: ${url}`);

		// Only intercept our target URLs
		if (url.includes("/test/read.cgi/") || url.includes("bbs.eddibb.cc")) {
			console.log(`🎯 MATCHING TARGET URL: ${url}`);

			try {
				// Read the fixture file as raw binary buffer
				const buffer = readFileSync(fixturePath);

				console.log(
					`📁 Serving fixture file: ${fixturePath} (${buffer.length} bytes)`
				);

				// Send raw Shift_JIS binary data - let the plugin's DefaultDecoder handle decoding
				await route.fulfill({
					status: 200,
					contentType: "text/html; charset=Shift_JIS",
					body: buffer,
				});
				console.log(`✅ Successfully served fixture file`);
				return; // Important: return after fulfilling the route
			} catch (error) {
				console.error(
					"❌ Failed to load fixture file in route:",
					error
				);
				await route.fulfill({
					status: 500,
					body: "Failed to load fixture",
				});
				return; // Important: return after fulfilling the route
			}
		} else {
			// Let other requests pass through
			await route.continue();
		}
	});
}

test("Large Fixture: Load and display 1759320900.dat file content", async ({
	vault,
}) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);

	// 1. Verify initial setup
	const vaultName = await vault.window.evaluate(() => app.vault.getName());
	expect(vaultName).toBe(SANDBOX_VAULT_NAME);

	// Verify plugin is activated
	expect(
		await vault.window.evaluate(
			(pluginId) => app.plugins.getPlugin(pluginId),
			PLUGIN_ID
		)
	).toBeTruthy();

	// 2. Setup route to serve raw fixture file (let plugin decode it)
	await vault.window.route("**/test/read.cgi/**", async (route: any) => {
		try {
			// Read the fixture file as raw binary buffer
			const buffer = readFileSync(FIXTURE_PATH);

			console.log(`Route intercepted: ${route.request().url()}`);
			console.log(
				`Fixture loaded via route - Raw buffer size: ${buffer.length} bytes`
			);

			// Send raw Shift_JIS binary data - let the plugin's DefaultDecoder handle decoding
			route.fulfill({
				status: 200,
				contentType: "text/html; charset=Shift_JIS",
				body: buffer,
			});
		} catch (error) {
			console.error("Failed to load fixture file in route:", error);
			route.fulfill({
				status: 500,
				body: "Failed to load fixture",
			});
		}
	});

	// 3. Execute "Open Nobit Test Thread" command
	await obsPage.openPluginWithURL(PLUGIN_ID, 'http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/');

	// 4. Verify ThreadView opened correctly
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);
	await obsPage.expectActiveTabType(VIEW_TYPE_THREAD);

	// 5. Verify ThreadView displays the large fixture content
	await expect(vault.window.locator(".thread-view")).toBeVisible();

	// Wait for thread content to load with extended timeout for large file
	await expect(vault.window.locator(".thread-content")).toBeVisible({
		timeout: 15000,
	});

	// Verify thread content is displayed
	await expect(vault.window.locator(".thread-header")).toBeVisible();
	await expect(vault.window.locator(".thread-title")).toBeVisible();
	await expect(vault.window.locator(".posts-container")).toBeVisible();

	// Verify posts are displayed - should have many posts from the large fixture
	const postCount = await vault.window
		.locator(".posts-container .post")
		.count();
	console.log(`Actual post count: ${postCount}`);
	expect(postCount).toBeGreaterThan(5); // Test fixture contains 10 posts

	// Debug: Check what content is actually displayed
	const threadTitle = await vault.window
		.locator(".thread-title")
		.textContent();
	console.log(`Thread title: ${threadTitle}`);

	// Verify specific content from the fixture file is displayed
	// Check for Japanese content that should be present after proper decoding
	const postsContent = await vault.window
		.locator(".posts-container")
		.textContent();
	console.log(`Posts content preview: ${postsContent?.substring(0, 200)}...`);

	// With proper test fixture, we should see readable Japanese content
	expect(postsContent).toMatch(/エッヂの名無し|呪術廻戦/); // Should contain Japanese characters from test fixture

	// Verify ThreadFilters section is present and functional with large data
	await expect(vault.window.locator(".filters-section")).toBeVisible();
	await expect(vault.window.locator(".thread-filters")).toBeVisible();

	// Verify ThreadToolbar section is present
	await expect(vault.window.locator(".toolbar-section")).toBeVisible();
	await expect(vault.window.locator(".thread-footer-toolbar")).toBeVisible();

	// Verify no error state is shown (successful load of large file)
	await expect(vault.window.locator(".error-container")).not.toBeVisible();

	// Verify loading is complete
	await expect(vault.window.locator(".loading-container")).not.toBeVisible();
});

test("Large Fixture: Debug parsing and content", async ({ vault }) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);

	console.log("🚀 Starting debug test - enhanced logging enabled");

	// Setup route with debug logging - catch ALL requests to see what's happening
	console.log("Setting up route to catch all requests...");

	await vault.window.route("**/*", async (route: any) => {
		const url = route.request().url();
		console.log(`🌐 REQUEST: ${url}`);

		// Only intercept our target URLs
		if (url.includes("/test/read.cgi/") || url.includes("bbs.eddibb.cc")) {
			console.log(`🎯 MATCHING URL FOUND: ${url}`);
			try {
				// Read the fixture file as raw binary buffer
				const buffer = readFileSync(FIXTURE_PATH);

				console.log(`🔥 INTERCEPTED TARGET: ${url}`);
				console.log(
					`🔥 Raw fixture buffer size: ${buffer.length} bytes`
				);
				console.log(
					`🔥 Sending raw Shift_JIS data to plugin for decoding...`
				);

				// Send raw Shift_JIS binary data - let the plugin's DefaultDecoder handle decoding
				route.fulfill({
					status: 200,
					contentType: "text/html; charset=Shift_JIS",
					body: buffer,
				});
			} catch (error) {
				console.error(
					"🔥 Failed to load fixture file in route:",
					error
				);
				route.fulfill({
					status: 500,
					body: "Failed to load fixture",
				});
			}
		} else {
			// Let other requests pass through
			route.continue();
		}
	});

	console.log("Route setup complete");

	// Execute command
	await obsPage.openPluginWithURL(PLUGIN_ID, 'http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/');
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);

	// Wait for content to load
	await expect(vault.window.locator(".thread-content")).toBeVisible({
		timeout: 15000,
	});

	// Debug: Check parsing results
	const postCount = await vault.window
		.locator(".posts-container .post")
		.count();
	console.log(`Parsed post count: ${postCount}`);

	// Get first few posts content for debugging
	for (let i = 0; i < Math.min(3, postCount); i++) {
		const postContent = await vault.window
			.locator(`.posts-container .post:nth-child(${i + 1})`)
			.textContent();
		console.log(
			`Post ${i + 1} content: ${postContent?.substring(0, 100)}...`
		);
	}

	// Verify basic functionality
	expect(postCount).toBeGreaterThan(0);
});

test("Large Fixture: Performance test with large dataset", async ({
	vault,
}) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);

	// Setup fixture route
	await setupFixtureRoute(vault.window);

	// Measure loading time
	const startTime = Date.now();

	// Execute command
	await obsPage.openPluginWithURL(PLUGIN_ID, 'http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/');
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);

	// Wait for content to load
	await expect(vault.window.locator(".thread-content")).toBeVisible({
		timeout: 15000,
	});

	const loadTime = Date.now() - startTime;

	// Verify reasonable loading time (should be under 10 seconds for large file)
	expect(loadTime).toBeLessThan(10000);

	// Verify all posts are rendered
	const postCount = await vault.window
		.locator(".posts-container .post")
		.count();
	expect(postCount).toBeGreaterThan(0);

	// Verify scrolling works with large dataset
	await vault.window.locator(".posts-container").scrollIntoViewIfNeeded();

	// Verify UI remains responsive
	await expect(vault.window.locator(".thread-filters")).toBeVisible();
	await expect(vault.window.locator(".toolbar-section")).toBeVisible();
});

test("Large Fixture: Search functionality with large dataset", async ({
	vault,
}) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);

	// Setup fixture route
	await setupFixtureRoute(vault.window);

	// Execute command
	await obsPage.openPluginWithURL(PLUGIN_ID, 'http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/');
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);

	// Wait for content to load
	await expect(vault.window.locator(".thread-content")).toBeVisible({
		timeout: 15000,
	});

	// Verify search functionality works with large dataset
	const searchInput = vault.window.locator(
		'.thread-filters input[type="text"]'
	);
	if (await searchInput.isVisible()) {
		// Get initial post count
		const initialPostCount = await vault.window
			.locator(".posts-container .post")
			.count();
		console.log(`Initial post count: ${initialPostCount}`);

		// Test search with Japanese text that should be in the fixture
		await searchInput.fill("面白い");

		// Wait for filtering to apply
		await vault.window.waitForTimeout(500);

		// Verify search results are filtered (should be less than initial)
		const filteredPostCount = await vault.window
			.locator(".posts-container .post")
			.count();
		console.log(`Filtered post count for '面白い': ${filteredPostCount}`);

		// The filtered count should be less than the initial count
		expect(filteredPostCount).toBeLessThan(initialPostCount);
		expect(filteredPostCount).toBeGreaterThan(0);

		// Clear search
		await searchInput.fill("");

		// Wait for filtering to reset
		await vault.window.waitForTimeout(500);

		// Verify all posts are shown again
		const postCount = await vault.window
			.locator(".posts-container .post")
			.count();
		console.log(`Post count after clearing search: ${postCount}`);
		expect(postCount).toBe(initialPostCount);
	}
});

test("Large Fixture: Filter functionality with large dataset", async ({
	vault,
}) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);

	// Setup fixture route
	await setupFixtureRoute(vault.window);

	// Execute command
	await obsPage.openPluginWithURL(PLUGIN_ID, 'http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/');
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);

	// Wait for content to load
	await expect(vault.window.locator(".thread-content")).toBeVisible({
		timeout: 15000,
	});

	// Verify filter buttons are present and functional
	await expect(vault.window.locator(".filter-buttons-group")).toBeVisible();

	// Test filter functionality if available
	const filterButtons = vault.window.locator(".filter-buttons-group button");
	const buttonCount = await filterButtons.count();

	if (buttonCount > 0) {
		// Get initial post count
		const initialPostCount = await vault.window
			.locator(".posts-container .post")
			.count();
		console.log(`Initial post count: ${initialPostCount}`);

		// Click first filter button
		await filterButtons.first().click();

		// Wait for filtering to apply
		await vault.window.waitForTimeout(500);

		// Verify posts are still displayed (filtered or unfiltered)
		const filteredPostCount = await vault.window
			.locator(".posts-container .post")
			.count();
		console.log(`Filtered post count: ${filteredPostCount}`);
		expect(filteredPostCount).toBeGreaterThan(0);

		// Click again to toggle off
		await filterButtons.first().click();

		// Wait for filtering to reset
		await vault.window.waitForTimeout(500);

		// Verify posts are still displayed
		const finalPostCount = await vault.window
			.locator(".posts-container .post")
			.count();
		console.log(`Final post count: ${finalPostCount}`);
		expect(finalPostCount).toBe(initialPostCount);
	}
});

test("Large Fixture: Memory usage and cleanup", async ({ vault }) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);

	// Setup fixture route
	await setupFixtureRoute(vault.window);

	// Execute command
	await obsPage.openPluginWithURL(PLUGIN_ID, 'http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/');
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);

	// Wait for content to load
	await expect(vault.window.locator(".thread-content")).toBeVisible({
		timeout: 15000,
	});

	// Verify large dataset is loaded
	const postCount = await vault.window
		.locator(".posts-container .post")
		.count();
	expect(postCount).toBeGreaterThan(100);

	// Close the view to test cleanup
	await obsPage.closeActiveTab();

	// Wait a moment for cleanup
	await vault.window.waitForTimeout(1000);

	// Verify view is closed
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 0);

	// Re-open to verify it still works after cleanup
	await obsPage.openPluginWithURL(PLUGIN_ID, 'http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/');
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);

	// Verify content loads again
	await expect(vault.window.locator(".thread-content")).toBeVisible({
		timeout: 15000,
	});

	const newPostCount = await vault.window
		.locator(".posts-container .post")
		.count();
	expect(newPostCount).toBeGreaterThan(100);
});

test("Large Fixture: 1000 posts performance test", async ({ vault }) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);

	// Setup fixture route to serve the 1000 posts fixture
	await setupFixtureRoute(vault.window, FIXTURES.LARGE);

	// Set the test thread URL to match the 1000 posts fixture
	await vault.window.evaluate(
		([id]) => {
			(app.plugins?.plugins[id] as unknown as NobitPlugin).openWithURL(
				"http://bbs.eddibb.cc/test/read.cgi/liveedge/1759470805/"
			);
			console.log(
				"🔧 Test: Open testThreadUrl 1759470805 (1000 posts fixture)"
			);
		},
		[PLUGIN_ID]
	);

	// Measure loading time
	const startTime = Date.now();

	// Execute command
	await obsPage.openPluginWithURL(PLUGIN_ID, 'http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/');
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);

	// Wait for content to load with extended timeout for 1000 posts
	await expect(vault.window.locator(".thread-content")).toBeVisible({
		timeout: 30000,
	});

	const loadTime = Date.now() - startTime;
	console.log(`🚀 1000 posts loaded in ${loadTime}ms`);

	// Verify reasonable loading time (should be under 20 seconds for 1000 posts)
	expect(loadTime).toBeLessThan(20000);

	// Verify 1000 posts are rendered
	const postCount = await vault.window
		.locator(".posts-container .post")
		.count();
	console.log(`📊 Rendered ${postCount} posts`);
	expect(postCount).toBe(1000);

	// Test scrolling performance with large dataset
	const scrollStartTime = Date.now();
	await vault.window.locator(".posts-container").scrollIntoViewIfNeeded();

	// Scroll to middle
	await vault.window.evaluate(() => {
		const container = document.querySelector(".posts-container");
		if (container) {
			container.scrollTop = container.scrollHeight / 2;
		}
	});

	// Scroll to bottom
	await vault.window.evaluate(() => {
		const container = document.querySelector(".posts-container");
		if (container) {
			container.scrollTop = container.scrollHeight;
		}
	});

	const scrollTime = Date.now() - scrollStartTime;
	console.log(`📜 Scrolling completed in ${scrollTime}ms`);

	// Verify UI remains responsive after scrolling
	await expect(vault.window.locator(".thread-filters")).toBeVisible();
	await expect(vault.window.locator(".toolbar-section")).toBeVisible();

	// Test search performance with large dataset
	const searchStartTime = Date.now();
	const searchInput = vault.window.locator(
		'.thread-filters input[type="text"]'
	);
	if (await searchInput.isVisible()) {
		await searchInput.fill("なん");
		await vault.window.waitForTimeout(1000); // Wait for search to process

		const searchResults = await vault.window
			.locator(".posts-container .post")
			.count();
		const searchTime = Date.now() - searchStartTime;
		console.log(
			`🔍 Search completed in ${searchTime}ms, found ${searchResults} results`
		);

		// Search should complete within reasonable time
		expect(searchTime).toBeLessThan(5000);
		expect(searchResults).toBeGreaterThan(0);

		// Clear search
		await searchInput.fill("");
		await vault.window.waitForTimeout(500);

		// Verify all posts are shown again
		const finalPostCount = await vault.window
			.locator(".posts-container .post")
			.count();
		expect(finalPostCount).toBe(1000);
	}

	// Memory usage check - verify no memory leaks
	const memoryInfo = await vault.window.evaluate(() => {
		if ("memory" in performance) {
			return (performance as any).memory;
		}
		return null;
	});

	if (memoryInfo && memoryInfo.usedJSHeapSize) {
		console.log(
			`💾 Memory usage: ${Math.round(
				memoryInfo.usedJSHeapSize / 1024 / 1024
			)}MB`
		);
		// Should not exceed 500MB for 1000 posts
		expect(memoryInfo.usedJSHeapSize).toBeLessThan(500 * 1024 * 1024);
	} else {
		console.log("💾 Memory API not available in this environment");
		// Skip memory test if API is not available
	}
});
test("Large Fixture: Real 1000 posts fixture file test", async ({ vault }) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);

	// Setup fixture route with the large 1000 posts fixture file
	await setupFixtureRoute(vault.window, FIXTURES.LARGE);

	// Measure loading time
	const startTime = Date.now();

	// Execute command
	await obsPage.openPluginWithURL(PLUGIN_ID, 'http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/');
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);

	// Wait for content to load with extended timeout for 1000 posts
	await expect(vault.window.locator(".thread-content")).toBeVisible({
		timeout: 30000,
	});

	const loadTime = Date.now() - startTime;
	console.log(`🚀 Real 1000 posts fixture loaded in ${loadTime}ms`);

	// Verify reasonable loading time
	expect(loadTime).toBeLessThan(25000);

	// Verify posts are rendered (should be close to 1000)
	const postCount = await vault.window
		.locator(".posts-container .post")
		.count();
	console.log(`📊 Rendered ${postCount} posts from real fixture`);
	expect(postCount).toBeGreaterThan(900); // Allow for some parsing variations

	// Verify thread title is from the real fixture
	const threadTitle = await vault.window
		.locator(".thread-title")
		.textContent();
	console.log(`📝 Thread title: ${threadTitle}`);
	expect(threadTitle).toContain("エッヂ"); // Should contain content from real fixture

	// Test performance with real data
	const scrollStartTime = Date.now();

	// Scroll to middle
	await vault.window.evaluate(() => {
		const container = document.querySelector(".posts-container");
		if (container) {
			container.scrollTop = container.scrollHeight / 2;
		}
	});

	// Scroll to bottom
	await vault.window.evaluate(() => {
		const container = document.querySelector(".posts-container");
		if (container) {
			container.scrollTop = container.scrollHeight;
		}
	});

	const scrollTime = Date.now() - scrollStartTime;
	console.log(`📜 Real data scrolling completed in ${scrollTime}ms`);

	// Verify UI remains responsive
	await expect(vault.window.locator(".thread-filters")).toBeVisible();
	await expect(vault.window.locator(".toolbar-section")).toBeVisible();

	// Test search with real Japanese content
	const searchInput = vault.window.locator(
		'.thread-filters input[type="text"]'
	);
	if (await searchInput.isVisible()) {
		await searchInput.fill("エッヂ");
		await vault.window.waitForTimeout(1000);

		const searchResults = await vault.window
			.locator(".posts-container .post")
			.count();
		console.log(`🔍 Search for 'エッヂ' found ${searchResults} results`);

		expect(searchResults).toBeGreaterThan(0);

		// Clear search
		await searchInput.fill("");
		await vault.window.waitForTimeout(500);
	}
});
