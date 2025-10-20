export function isPlaywrightEnvironment(): boolean {
	if (typeof process !== "undefined" && process.env.PLAYWRIGHT) {
		return true;
	}
	if (typeof window !== "undefined" && (window as any).playwright) {
		return true;
	}
	return false;
}
export function shouldUseDefaultFetcher(): boolean {
	if (typeof process !== "undefined") {
		return process.env.USE_DEFAULT_FETCHER === "true";
	}
	return false;
}
