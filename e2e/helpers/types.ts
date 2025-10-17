// ===================================================================
// 1. Core Types (types.mts)
// ===================================================================

import type { ElectronApplication, JSHandle, Page } from "playwright";

// Minimal Plugin interface to avoid importing from obsidian package
export interface Plugin {
	[key: string]: any;
}

export interface VaultConfig {
	name: string;
	path?: string;
	plugins?: string[];
	enablePlugins?: boolean;
}

export interface TestContext {
	electronApp: ElectronApplication;
	window: Page;
	vaultName?: string;
}

export interface VaultPageTextContext extends TestContext {
	pluginHandleMap: JSHandle<Map<string, Plugin>>;
}
export interface VaultOptions {
	name?: string;
	vaultPath?: string;
	forceNewVault?: boolean;
	useSandbox?: boolean;
	showLoggerOnNode?: boolean;
	plugins?: TestPlugin[];
}
export interface TestPlugin {
	path: string;
	pluginId: string;
	useSymlink?: boolean;
}
