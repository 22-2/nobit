// ==================== Utilities ====================
/**
 * Sleep for the specified number of milliseconds.
 *
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Safely get error message from unknown error type.
 *
 * @param error - Unknown error
 * @returns Error message string
 */

export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	return String(error);
}
/**
 * Ensure error is an Error instance.
 *
 * @param error - Unknown error
 * @returns Error instance
 */

export function ensureError(error: unknown): Error {
	if (error instanceof Error) {
		return error;
	}
	return new Error(String(error));
}
/**
 * Detect if running in test environment.
 *
 * @returns True if in test environment
 */

export function isTestEnvironment(): boolean {
	return (
		typeof process !== "undefined" &&
		(process.env?.NODE_ENV === "test" ||
			process.env?.VITEST === "true" ||
			(typeof global !== "undefined" &&
				(global as any).describe !== undefined))
	);
}
/**
 * Truncate content to maximum length.
 *
 * @param content - Content to truncate
 * @param maxLength - Maximum length
 * @returns Truncated content
 */

export function truncateContent(content: string, maxLength: number): string {
	if (content.length <= maxLength) {
		return content;
	}
	return content.substring(0, maxLength) + "...";
}
