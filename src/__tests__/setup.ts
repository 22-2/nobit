import { vi } from "vitest";
// Global test setup

// Mock Svelte 5's $state for testing - simple implementation that returns the initial value
(global as any).$state = vi.fn((initialValue: any) => initialValue);

// Mock $derived and $derived.by
const derivedMock = vi.fn((initialValue: any) => initialValue);
// @ts-expect-error
derivedMock.by = vi.fn((fn: () => any) => fn());
(global as any).$derived = derivedMock;

// Mock loglevel
vi.mock("loglevel", () => ({
	default: {
		getLogger: vi.fn(() => ({
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
		})),
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
	getLogger: vi.fn(() => ({
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	})),
}));

// Global test setup
global.console = {
	...console,
	// Suppress console.log in tests unless explicitly testing it
	log: vi.fn(),
	debug: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
};
