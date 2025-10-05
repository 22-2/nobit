import { expect, test } from "../base";
import {
	DIST_DIR,
	PLUGIN_ID,
	SANDBOX_VAULT_NAME,
} from "../constants";
import { ObsidianPageObject } from "../helpers/ObsidianPageObject";
import { VIEW_TYPE_THREAD } from "../../src/utils/constants";

// Generate mock thread data with 1000+ posts for performance testing
function generateLargeThreadData(postCount: number = 1000): string {
	const posts: string[] = [];
	
	for (let i = 1; i <= postCount; i++) {
		const authorName = `テストユーザー${i % 100}`;
		const mail = i % 20 === 0 ? "sage" : "";
		const authorId = `ID${String(i % 1000).padStart(3, '0')}ABC`;
		const timestamp = `2024/01/01(月) ${String(10 + (i % 14)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}.${String((i * 13) % 100).padStart(2, '0')}`;
		
		// Vary content length and complexity
		let content = `これは投稿番号${i}のテストポストです。`;
		
		// Add some variety to content
		if (i % 10 === 0) {
			content += `<br>長めのコンテンツを含む投稿です。<br>複数行にわたって書かれています。<br>パフォーマンステストのためのデータです。`;
		}
		
		if (i % 25 === 0) {
			content += `<br>>>${Math.max(1, i - 5)} >>${Math.max(1, i - 10)}<br>アンカー付きの投稿です。`;
		}
		
		if (i % 50 === 0) {
			content += `<br>https://example.com/image${i}.jpg<br>画像URLを含む投稿です。`;
		}
		
		const threadTitle = i === 1 ? "パフォーマンステスト用大規模スレッド" : "";
		
		// Correct DAT format: resNum<>authorName<>mail<>timestamp ID:authorId<>content<>threadTitle
		posts.push(`${i}<>${authorName}<>${mail}<>${timestamp} ${authorId}<>${content}<>${threadTitle}`);
	}
	
	return posts.join('\n');
}

test("Performance: Handle current thread data smoothly", async ({ vault }) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);

	// 1. Verify initial setup
	const vaultName = await vault.window.evaluate(() => app.vault.getName());
	expect(vaultName).toBe(SANDBOX_VAULT_NAME);

	// 2. Mock the exact hardcoded URL used in ThreadViewComponent
	const largeThreadData = generateLargeThreadData(500); // Use reasonable size for real testing
	await vault.window.route('**/liveedge/1759320900/**', route => {
		route.fulfill({
			status: 200,
			contentType: 'text/html; charset=Shift_JIS',
			body: largeThreadData
		});
	});

	// 3. Measure initial load time
	const startTime = Date.now();
	
	await obsPage.openPluginWithURL(PLUGIN_ID, 'https://eagle.5ch.net/test/read.cgi/livejupiter/1759320900/');
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);
	
	// Wait for thread content to load
	await expect(vault.window.locator('.thread-content')).toBeVisible({ timeout: 15000 });
	await expect(vault.window.locator('.posts-container')).toBeVisible();
	
	const loadTime = Date.now() - startTime;
	console.log(`Thread load time: ${loadTime}ms`);
	
	// 4. Verify posts are loaded (should be the mocked amount)
	const postCount = await vault.window.locator('.posts-container .post').count();
	console.log(`Loaded post count: ${postCount}`);
	expect(postCount).toBeGreaterThan(0);
	
	// 5. Verify thread content is displayed
	await expect(vault.window.locator('.thread-title')).toBeVisible();
	await expect(vault.window.locator('.post-count')).toContainText('posts');
	
	// 6. Performance should be reasonable (under 10 seconds)
	expect(loadTime).toBeLessThan(10000);
	
	// 7. Verify ThreadManager state is consistent
	const threadManagerState = await vault.window.evaluate(() => {
		const activeLeaf = app.workspace.activeLeaf;
		if (activeLeaf && activeLeaf.view.getViewType() === "thread-view") {
			const threadView = activeLeaf.view as any;
			const threadManager = threadView.threadManager;
			return {
				hasThread: !!threadManager.thread,
				threadPostsLength: threadManager.thread?.posts?.length || 0,
				isLoading: threadManager.isLoading,
				error: threadManager.error
			};
		}
		return null;
	});
	
	expect(threadManagerState?.hasThread).toBe(true);
	expect(threadManagerState?.threadPostsLength).toBeGreaterThan(0);
	expect(threadManagerState?.isLoading).toBe(false);
	expect(threadManagerState?.error).toBeNull();
});

test("Performance: Smooth scrolling with thread content", async ({ vault }) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);

	// 1. Load thread (uses real or fallback data)
	await obsPage.openPluginWithURL(PLUGIN_ID, 'https://eagle.5ch.net/test/read.cgi/livejupiter/1759320900/');
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);
	await expect(vault.window.locator('.thread-content')).toBeVisible({ timeout: 10000 });
	
	// 2. Test scrolling performance with actual loaded content
	const postsContainer = vault.window.locator('.posts-container');
	await expect(postsContainer).toBeVisible();
	
	// Get the actual post count for realistic testing
	const postCount = await vault.window.locator('.posts-container .post').count();
	console.log(`Testing scrolling with ${postCount} posts`);
	
	// Measure scroll performance
	const scrollStartTime = Date.now();
	
	// Scroll to bottom
	await postsContainer.evaluate(el => {
		el.scrollTop = el.scrollHeight;
	});
	
	// Wait for scroll to complete
	await vault.window.waitForTimeout(100);
	
	// Scroll to middle
	await postsContainer.evaluate(el => {
		el.scrollTop = el.scrollHeight / 2;
	});
	
	// Wait for scroll to complete
	await vault.window.waitForTimeout(100);
	
	// Scroll to top
	await postsContainer.evaluate(el => {
		el.scrollTop = 0;
	});
	
	const scrollTime = Date.now() - scrollStartTime;
	console.log(`Scroll operations time: ${scrollTime}ms`);
	
	// 3. Verify scrolling completed successfully
	const scrollTop = await postsContainer.evaluate(el => el.scrollTop);
	expect(scrollTop).toBe(0);
	
	// 4. Scrolling should be smooth (under 1 second for basic operations)
	expect(scrollTime).toBeLessThan(1000);
});

test("Performance: Memory usage validation", async ({ vault }) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);

	// 1. Get initial memory usage
	const initialMemory = await vault.window.evaluate(() => {
		if ('memory' in performance) {
			return (performance as any).memory.usedJSHeapSize;
		}
		return 0;
	});

	// 2. Mock large thread response
	const largeThreadData = generateLargeThreadData(1000);
	await vault.window.route('**/test/read.cgi/**', route => {
		route.fulfill({
			status: 200,
			contentType: 'text/html; charset=Shift_JIS',
			body: largeThreadData
		});
	});

	// 3. Load thread
	await obsPage.openPluginWithURL(PLUGIN_ID, 'https://eagle.5ch.net/test/read.cgi/livejupiter/1759320900/');
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);
	await expect(vault.window.locator('.thread-content')).toBeVisible({ timeout: 15000 });
	
	// 4. Get memory usage after loading
	const afterLoadMemory = await vault.window.evaluate(() => {
		if ('memory' in performance) {
			return (performance as any).memory.usedJSHeapSize;
		}
		return 0;
	});

	// 5. Close the thread view to test cleanup
	await vault.window.evaluate(() => {
		const activeLeaf = app.workspace.activeLeaf;
		if (activeLeaf) {
			activeLeaf.detach();
		}
	});

	// Wait for cleanup
	await vault.window.waitForTimeout(1000);

	// 6. Get memory usage after cleanup
	const afterCleanupMemory = await vault.window.evaluate(() => {
		// Force garbage collection if available
		if ('gc' in window) {
			(window as any).gc();
		}
		if ('memory' in performance) {
			return (performance as any).memory.usedJSHeapSize;
		}
		return 0;
	});

	console.log(`Memory usage - Initial: ${initialMemory}, After load: ${afterLoadMemory}, After cleanup: ${afterCleanupMemory}`);

	// 7. Verify memory usage is reasonable
	if (initialMemory > 0 && afterLoadMemory > 0) {
		const memoryIncrease = afterLoadMemory - initialMemory;
		console.log(`Memory increase: ${memoryIncrease} bytes`);
		
		// Memory increase should be reasonable (less than 10MB for current thread size)
		expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
		
		// Note: Memory cleanup in browser environments is not immediate and depends on GC
		// We just verify that memory usage is within reasonable bounds
		if (afterCleanupMemory > 0) {
			const memoryAfterCleanup = afterCleanupMemory - initialMemory;
			console.log(`Memory after cleanup (relative to initial): ${memoryAfterCleanup} bytes`);
			
			// Memory after cleanup should still be reasonable (less than 15MB)
			expect(memoryAfterCleanup).toBeLessThan(15 * 1024 * 1024);
		}
	}
});

test("Performance: Refresh performance with current thread", async ({ vault }) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);

	// 1. Initial load
	await obsPage.openPluginWithURL(PLUGIN_ID, 'https://eagle.5ch.net/test/read.cgi/livejupiter/1759320900/');
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);
	await expect(vault.window.locator('.thread-content')).toBeVisible({ timeout: 15000 });
	
	// Get initial post count
	const initialPostCount = await vault.window.locator('.posts-container .post').count();
	console.log(`Initial post count: ${initialPostCount}`);
	
	// 2. Test refresh performance
	const refreshButton = vault.window.locator('.toolbar-section .clickable-icon');
	await expect(refreshButton).toBeVisible();
	
	const refreshStartTime = Date.now();
	
	// Click refresh (force click to avoid status bar interference)
	await refreshButton.click({ force: true });
	
	// Wait for loading state (may be brief)
	try {
		await expect(vault.window.locator('.loading-container')).toBeVisible({ timeout: 1000 });
	} catch {
		// Loading might be too fast to catch, that's okay
	}
	
	// Wait for refresh to complete
	await expect(vault.window.locator('.thread-content')).toBeVisible({ timeout: 10000 });
	
	const refreshTime = Date.now() - refreshStartTime;
	console.log(`Refresh time: ${refreshTime}ms`);
	
	// 3. Verify refresh completed successfully
	const postCountAfterRefresh = await vault.window.locator('.posts-container .post').count();
	console.log(`Post count after refresh: ${postCountAfterRefresh}`);
	expect(postCountAfterRefresh).toBeGreaterThan(0);
	
	// 4. Refresh should be reasonably fast (under 10 seconds)
	expect(refreshTime).toBeLessThan(10000);
	
	// 5. Verify ThreadManager state is consistent after refresh
	const threadManagerState = await vault.window.evaluate(() => {
		const activeLeaf = app.workspace.activeLeaf;
		if (activeLeaf && activeLeaf.view.getViewType() === "thread-view") {
			const threadView = activeLeaf.view as any;
			const threadManager = threadView.threadManager;
			return {
				hasThread: !!threadManager.thread,
				threadPostsLength: threadManager.thread?.posts?.length || 0,
				isLoading: threadManager.isLoading,
				error: threadManager.error
			};
		}
		return null;
	});
	
	expect(threadManagerState?.hasThread).toBe(true);
	expect(threadManagerState?.isLoading).toBe(false);
	expect(threadManagerState?.error).toBeNull();
});

test("Performance: Filter operations with current thread", async ({ vault }) => {
	const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);

	// 1. Load thread
	await obsPage.openPluginWithURL(PLUGIN_ID, 'https://eagle.5ch.net/test/read.cgi/livejupiter/1759320900/');
	await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);
	await expect(vault.window.locator('.thread-content')).toBeVisible({ timeout: 15000 });
	
	const postCount = await vault.window.locator('.posts-container .post').count();
	console.log(`Testing filters with ${postCount} posts`);
	
	// 2. Test filter performance
	const filtersSection = vault.window.locator('.filters-section');
	await expect(filtersSection).toBeVisible();
	
	// Test search filter performance (if available)
	const searchInput = vault.window.locator('.thread-filters input[type="text"]');
	if (await searchInput.count() > 0) {
		const filterStartTime = Date.now();
		
		await searchInput.fill('test');
		
		// Wait a moment for filter to apply
		await vault.window.waitForTimeout(500);
		
		const filterTime = Date.now() - filterStartTime;
		console.log(`Search filter operation time: ${filterTime}ms`);
		
		// Filter should be fast (under 1 second)
		expect(filterTime).toBeLessThan(1000);
		
		// Clear the filter
		await searchInput.clear();
		await vault.window.waitForTimeout(200);
	}
	
	// Test filter button performance
	const filterButtons = vault.window.locator('.filter-buttons-group button');
	const buttonCount = await filterButtons.count();
	console.log(`Found ${buttonCount} filter buttons`);
	
	if (buttonCount > 0) {
		const buttonFilterStartTime = Date.now();
		
		// Click first filter button (force click to avoid interference)
		await filterButtons.first().click({ force: true });
		
		// Wait for filter to apply
		await vault.window.waitForTimeout(200);
		
		const buttonFilterTime = Date.now() - buttonFilterStartTime;
		console.log(`Button filter time: ${buttonFilterTime}ms`);
		
		// Button filter should be very fast (under 500ms)
		expect(buttonFilterTime).toBeLessThan(500);
		
		// Click again to toggle off
		await filterButtons.first().click({ force: true });
		await vault.window.waitForTimeout(200);
	}
	
	// 3. Verify filter state management performance
	const filterStateTime = Date.now();
	
	// Test ThreadManager filter state updates
	const threadManagerState = await vault.window.evaluate(() => {
		const activeLeaf = app.workspace.activeLeaf;
		if (activeLeaf && activeLeaf.view.getViewType() === "thread-view") {
			const threadView = activeLeaf.view as any;
			const threadManager = threadView.threadManager;
			return {
				filters: threadManager.filters,
				hasThread: !!threadManager.thread
			};
		}
		return null;
	});
	
	const stateCheckTime = Date.now() - filterStateTime;
	console.log(`Filter state check time: ${stateCheckTime}ms`);
	
	expect(threadManagerState?.hasThread).toBe(true);
	expect(threadManagerState?.filters).toBeDefined();
	expect(stateCheckTime).toBeLessThan(100); // State access should be very fast
});

// Custom test configuration for performance tests
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