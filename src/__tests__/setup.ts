// Global test setup

// Mock Svelte 5's $state for testing - simple implementation that returns the initial value
(global as any).$state = jest.fn((initialValue: any) => initialValue);

// Mock loglevel
jest.mock("loglevel", () => ({
	getLogger: jest.fn(() => ({
		debug: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	})),
}));

// Global test setup
global.console = {
	...console,
	// Suppress console.log in tests unless explicitly testing it
	log: jest.fn(),
	debug: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
};