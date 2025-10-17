#!/usr/bin/env node
/**
 * Manual testing script for Obsidian plugin
 *
 * Usage:
 *   pnpm manual           # Launch with plugin in a new vault
 *   pnpm manual:sandbox   # Launch in sandbox mode (shared vault)
 *
 * This script launches Obsidian with the plugin installed and keeps it open
 * for manual testing and exploration. Press Ctrl+C to exit.
 */

import log from "loglevel";
import { DEFAULT_TEST_CONFIG } from "./helpers/BaseTestSetup";
import { ObsidianTestSetup } from "./setup/ObsidianTestSetup";
import "./setup/logger-setup";

const logger = log.getLogger("manual");

async function main() {
	const useSandbox = process.argv.includes("--sandbox");
	const mode = useSandbox ? "sandbox" : "new vault";

	logger.info(`🚀 Starting Obsidian in manual testing mode (${mode})...`);
	logger.info("📝 The plugin is already installed and enabled");
	logger.info("⚠️  Press Ctrl+C to exit\n");


	const setup = new ObsidianTestSetup();

	try {
		await setup.launch({ useDefaultFetcher: true, useUTF8Encoding: false });
		logger.info("✅ Obsidian launched successfully");

		// Open vault with the plugin
		const context = useSandbox
			? await setup.openSandbox({
					plugins: DEFAULT_TEST_CONFIG.vaultOptions.plugins,
			  })
			: await setup.openVault({
					plugins: DEFAULT_TEST_CONFIG.vaultOptions.plugins,
			  });

		logger.info(`✅ Vault opened: ${context.vaultName || "Unknown"}`);
		logger.info("\n🎉 Ready for manual testing!");
		logger.info("💡 You can now interact with Obsidian freely");
		logger.info("🛑 Press Ctrl+C when you're done\n");

		// Keep the process running
		await new Promise(() => {
			// This promise never resolves, keeping the app open
		});
	} catch (error) {
		logger.error("❌ Error:", error);
		process.exit(1);
	}
}

// Handle cleanup on exit
process.on("SIGINT", async () => {
	logger.info("\n\n👋 Shutting down...");
	process.exit(0);
});

process.on("SIGTERM", async () => {
	logger.info("\n\n👋 Shutting down...");
	process.exit(0);
});

main();
