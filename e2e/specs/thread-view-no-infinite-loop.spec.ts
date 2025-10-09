import { readFileSync } from "fs";
import path, { join } from "path";
import { fileURLToPath } from "url";
import { expect, test } from "../base";
import { DIST_DIR, PLUGIN_ID, SANDBOX_VAULT_NAME } from "../constants";
import { ObsidianPageObject } from "../helpers/ObsidianPageObject";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Mock thread data

test("ThreadView should not cause infinite network requests", async ({ vault }) => {
  const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
  const mockThreadDatContent = readFileSync(join(__dirname, "../../src/__tests__/fixtures/1759470805.1000posts.dat"))

	// Verify initial setup
	const vaultName = await vault.window.evaluate(() => app.vault.getName());
	expect(vaultName).toBe(SANDBOX_VAULT_NAME);

	// Track network requests
	let requestCount = 0;
	const requestUrls: string[] = [];

	// Mock network responses and count requests
	await vault.window.route('**/test/read.cgi/**', route => {
		requestCount++;
		requestUrls.push(route.request().url());

		route.fulfill({
			status: 200,
			contentType: 'text/html; charset=Shift_JIS',
			body: mockThreadDatContent
		});
	});

	// Open thread view
	await obsPage.openPluginWithURL(
		PLUGIN_ID,
		'http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/290'
	);

	// Wait for thread to load
	await expect(vault.window.locator('.thread-view')).toBeVisible();
	await expect(vault.window.locator('.thread-content')).toBeVisible({ timeout: 10000 });

	// Wait a bit to ensure no additional requests are made
	await vault.window.waitForTimeout(2000);

	// Verify only ONE request was made
	expect(requestCount).toBe(1);
	console.log(`✅ Request count: ${requestCount}`);
	console.log(`✅ Request URLs:`, requestUrls);
});

test("ThreadView should not re-render when only title changes", async ({ vault }) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
  const mockThreadDatContent = readFileSync(join(__dirname, "../../src/__tests__/fixtures/1759470805.1000posts.dat"))

	let requestCount = 0;

	// Mock network responses
	await vault.window.route('**/test/read.cgi/**', route => {
		requestCount++;
		route.fulfill({
			status: 200,
			contentType: 'text/html; charset=Shift_JIS',
			body: mockThreadDatContent
		});
	});

	// Open thread view
	await obsPage.openPluginWithURL(
		PLUGIN_ID,
		'http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/'
	);

	// Wait for initial load
	await expect(vault.window.locator('.thread-view')).toBeVisible();
	await expect(vault.window.locator('.thread-content')).toBeVisible({ timeout: 10000 });

	const initialRequestCount = requestCount;

	// Simulate title change (without URL change)
	await vault.window.evaluate(() => {
		const view = app.workspace.getActiveViewOfType(
			require('../../src/view/ThreadView').ThreadView
		);
		if (view) {
			// Update title without changing URL
			view.setState(
				{ ...view.getState(), title: 'Updated Title' },
				{ history: false }
			);
		}
	});

	// Wait to ensure no new requests
	await vault.window.waitForTimeout(1000);

	// Should not make additional requests
	expect(requestCount).toBe(initialRequestCount);
	console.log(`✅ No additional requests after title change`);
});

test("ThreadView should re-render when URL changes", async ({ vault }) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
  const mockThreadDatContent = readFileSync(join(__dirname, "../../src/__tests__/fixtures/1759470805.1000posts.dat"))

	let requestCount = 0;

	// Mock network responses for different URLs
	await vault.window.route('**/test/read.cgi/**', route => {
		requestCount++;
		route.fulfill({
			status: 200,
			contentType: 'text/html; charset=Shift_JIS',
			body: mockThreadDatContent
		});
	});

	// Open first thread
	await obsPage.openPluginWithURL(
		PLUGIN_ID,
		'http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/'
	);

	await expect(vault.window.locator('.thread-view')).toBeVisible();
	await expect(vault.window.locator('.thread-content')).toBeVisible({ timeout: 10000 });

	const firstRequestCount = requestCount;
	expect(firstRequestCount).toBe(1);

	// Navigate to different URL
	await vault.window.evaluate(() => {
		const view = app.workspace.getActiveViewOfType(
			require('../../src/view/ThreadView').ThreadView
		);
		if (view) {
			view.navigateToThreadFromUrl(
				'https://eagle.5ch.net/test/read.cgi/livejupiter/9999999999/'
			);
		}
	});

	// Wait for new thread to load
	await vault.window.waitForTimeout(2000);

	// Should make exactly one more request
	expect(requestCount).toBe(2);
	console.log(`✅ Made new request after URL change: ${requestCount} total`);
});

test("ThreadView should handle network errors gracefully", async ({ vault }) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);

	let requestCount = 0;

	// Mock network error
	await vault.window.route('**/test/read.cgi/**', route => {
		requestCount++;
		route.fulfill({
			status: 500,
			contentType: 'text/plain',
			body: 'Internal Server Error'
		});
	});

	// Open thread view
	await obsPage.openPluginWithURL(
		PLUGIN_ID,
		'http://bbs.eddibb.cc/test/read.cgi/liveedge/1759970037/'
	);

	// Wait for error state
	await expect(vault.window.locator('.thread-view')).toBeVisible();
	await expect(vault.window.locator('.error-container')).toBeVisible({ timeout: 10000 });

	// Wait to ensure no retry loops
	await vault.window.waitForTimeout(2000);

	// Should only make one request (no infinite retries)
	expect(requestCount).toBe(1);
	console.log(`✅ No infinite retries on error: ${requestCount} request`);
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
