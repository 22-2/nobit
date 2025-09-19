import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
    // Storybookが起動するまで待機
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        // Storybookの起動を確認
        await page.goto("http://localhost:6006", { timeout: 120000 });
        await page.waitForSelector(
            '[data-testid="storybook-explorer-tree"], .sidebar-container',
            { timeout: 30000 }
        );
        console.log("✅ Storybook is ready for E2E tests");
    } catch (error) {
        console.error("❌ Failed to connect to Storybook:", error);
        throw error;
    } finally {
        await browser.close();
    }
}

export default globalSetup;
