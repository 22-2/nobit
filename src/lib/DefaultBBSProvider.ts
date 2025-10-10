import {
	BaseBBSProvider,
	type BaseBBSProviderOptions,
} from "./BaseBBSProvider";
import { ObsidianFetcher } from "./ObsidianFetcher";
import { TestFetcher } from "./TestFetcher";
import { DefaultDecoder } from "./libch/decoder";
import { DefaultFetcher, HttpError, type HttpFetcher } from "./libch/fetcher";
import { DefaultParser } from "./libch/parser";
import type { BBSProvider } from "./libch/provider";
import { parseBbsUrl } from "./libch/url";
import type {
	BBSMenu,
	PostData,
	PostResult,
	SubjectItem,
	Thread,
} from "./types";

export class DefaultBBSProvider extends BaseBBSProvider implements BBSProvider {
	readonly id = "default";
	readonly name = "5ch互換BBSプロバイダ";

	constructor(
		fetcher?: HttpFetcher,
		decoder?: DefaultDecoder,
		parser?: DefaultParser,
		options?: BaseBBSProviderOptions,
	) {
		// If no fetcher is provided, detect environment and use appropriate fetcher
		const actualFetcher =
			fetcher ??
			(DefaultBBSProvider.isPlaywrightEnvironment()
				? new TestFetcher()
				: new ObsidianFetcher());

		// Expose TestFetcher class to global scope for testing
		if (DefaultBBSProvider.isPlaywrightEnvironment()) {
			(window as any).TestFetcher = TestFetcher;
		}

		super(actualFetcher, decoder, parser, options);

		console.log(
			`🔧 DefaultBBSProvider: Using ${
				actualFetcher instanceof TestFetcher
					? "TestFetcher"
					: actualFetcher instanceof ObsidianFetcher
						? "ObsidianFetcher"
						: "DefaultFetcher"
			} (Playwright environment: ${DefaultBBSProvider.isPlaywrightEnvironment()})`,
		);
	}

	protected createDefaultFetcher(): HttpFetcher {
		return new DefaultFetcher();
	}

	/**
	 * Check if running in Playwright test environment.
	 * Playwright sets window.playwright or process.env.PLAYWRIGHT when running tests.
	 *
	 * @returns True if running in Playwright environment
	 */
	private static isPlaywrightEnvironment(): boolean {
		// Check for Playwright-specific environment variables
		if (typeof process !== "undefined" && process.env.PLAYWRIGHT) {
			return true;
		}

		// Check for Playwright global object in browser context
		if (typeof window !== "undefined" && (window as any).playwright) {
			return true;
		}

		return false;
	}

	canHandleUrl(url: string): boolean {
		// This is a simple check. A more robust implementation might check
		// against a list of known hosts. For now, we assume any URL that
		// can be parsed in the expected format is handled by this provider.
		return !!parseBbsUrl(url);
	}

	async getThreads(boardUrl: string): Promise<SubjectItem[]> {
		const parsed = parseBbsUrl(boardUrl);
		if (!parsed) {
			throw new Error(`Invalid board URL: ${boardUrl}`);
		}
		const { host, board } = parsed;
		const subjectTxtUrl = `https://${host}/${board}/subject.txt`;

		try {
			const buffer = await this.fetchWithRetry(subjectTxtUrl);
			const text = this.decodeBuffer(buffer);
			return this.parser.parseSubject(text);
		} catch (error) {
			console.error(`Failed to get subject.txt from ${subjectTxtUrl}:`, error);
			throw error;
		}
	}

	async getBoardTitle(boardUrl: string): Promise<string> {
		const parsed = parseBbsUrl(boardUrl);
		if (!parsed) {
			return "Unknown Board"; // Fallback
		}
		const { host, board } = parsed;

		const filenames = ["SETTING.TXT", "setting.txt"];
		for (const filename of filenames) {
			const url = `https://${host}/${board}/${filename}`;
			try {
				const buffer = await this.fetchWithRetry(url);
				const text = this.decodeBuffer(buffer);
				const match = text.match(/^BBS_TITLE=(.*)$/m);
				if (match && match[1]) {
					return match[1].trim();
				}
			} catch (error) {
				if (error instanceof HttpError && error.status === 404) {
					continue; // This is common, so don't log anything.
				}
				// For other errors (network, parsing), a warning is useful for debugging.
				console.warn(
					`Could not fetch board title from ${url}. This is often not a critical error. Falling back.`,
					error,
				);
			}
		}
		// Fallback to board ID
		return board;
	}

	async getThread(threadUrl: string): Promise<Thread> {
		const parsed = parseBbsUrl(threadUrl);
		if (!parsed?.threadId) {
			throw new Error(`Invalid thread URL: ${threadUrl}`);
		}
		const { host, board, threadId } = parsed;
		const datUrl = `https://${host}/${board}/dat/${threadId}.dat`;

		try {
			console.log("📥 Fetching thread data from:", datUrl);
			const buffer = await this.fetchWithRetry(datUrl);
			console.log("✅ Received buffer, size:", buffer.byteLength);

			const text = this.decodeBuffer(buffer);
			console.log(
				"✅ Decoded text, length:",
				text.length,
				"preview:",
				text.substring(0, 200),
			);

			const thread = this.parser.parseThread(text, threadId, threadUrl);
			if (!thread) {
				console.error("❌ Parser returned undefined");
				throw new Error(`Failed to parse thread from ${datUrl}`);
			}
			console.log("✅ Thread parsed successfully, posts:", thread.posts.length);
			return thread;
		} catch (error) {
			console.error(`Failed to get thread from ${datUrl}:`, error);
			throw error;
		}
	}

	async post(
		threadUrl: string,
		postData: PostData,
		headers?: Record<string, string>,
		confirmationData?: Record<string, string>,
	): Promise<PostResult> {
		const parsed = parseBbsUrl(threadUrl);
		if (!parsed?.threadId) {
			throw new Error(`Invalid thread URL: ${threadUrl}`);
		}
		const { host, board, threadId } = parsed;
		const postCgiUrl = `https://${host}/test/bbs.cgi`;

		const body = new URLSearchParams();
		body.set("bbs", board);
		body.set("key", threadId);
		body.set("charset", "UTF-8");

		if (confirmationData) {
			// Apply all hidden fields from the confirmation form
			for (const key in confirmationData) {
				confirmationData[key] && body.set(key, confirmationData[key]);
			}
			// The 'submit' value is critical for the confirmation step
			body.set("submit", "上記全てを承諾して書き込む");
			// Ensure 'feature' is set if it was part of the confirmation
			if (confirmationData.feature) {
				body.set("feature", confirmationData.feature);
			}
		} else {
			// For initial posts, set the time and default submit action
			body.set("time", String(Math.floor(Date.now() / 1000)));
			body.set("submit", "書き込む");
			body.set("oekaki_thread1", "");
			body.set("feature", ""); // Ensure feature is cleared for initial post
		}

		// Always use the user-provided data as the source of truth for the content
		body.set("FROM", postData.name);
		body.set("mail", postData.mail);
		body.set("MESSAGE", postData.content);

		try {
			const finalHeaders = {
				Referer: threadUrl,
				...headers,
			};
			let responseBuffer = await this.fetcher.post(
				postCgiUrl,
				body,
				finalHeaders,
				confirmationData,
			);
			const responseText = this.decodeBuffer(responseBuffer);

			console.log(responseText);

			// Handle confirmation screen
			if (/bbs\.cgi\?guid=ON/i.test(responseText)) {
				const formData: Record<string, string> = {};
				const hiddenInputs = responseText.matchAll(
					/<input type=hidden name=['"]?([^'"]+)['"]? value=['"]?([^'"]*)['"]?.*?>/g,
				);
				for (const input of hiddenInputs) {
					input[1] && input[2] && (formData[input[1]] = input[2]);
				}
				formData["submit"] = "上記全てを承諾して書き込む"; // Agree and post

				const bodyContentMatch = responseText.match(/<body.*?>(.*?)<\/body>/is);
				const html = String(bodyContentMatch ? bodyContentMatch[1] : "");

				return {
					kind: "confirmation",
					html,
					formData,
				};
			}

			if (responseText.includes("書きこみました")) {
				return { kind: "success", message: "書き込みに成功しました。" };
			}
			// Get error message from <title> tag
			const errorMatch = responseText.match(/<title>(.*?)<\/title>/);
			const errorMessage =
				errorMatch && errorMatch[1]
					? errorMatch[1]
					: "不明なエラーが発生しました。";
			return { kind: "error", message: errorMessage };
		} catch (error) {
			if (error instanceof HttpError) {
				// Confirmation pages often return non-200 status codes.
				// We decode the body and proceed, the logic below will check for confirmation.
				const responseText = this.decodeBuffer(
					await error.response.arrayBuffer(),
				);
				if (/bbs\.cgi\?guid=ON/i.test(responseText)) {
					const formData: Record<string, string> = {};
					const hiddenInputs = responseText.matchAll(
						/<input type=hidden name="([^"]+)" value="([^"]*)">/g,
					);
					for (const input of hiddenInputs) {
						input[1] && input[2] && (formData[input[1]] = input[2]);
					}
					formData["submit"] = "上記全てを承諾して書き込む"; // Agree and post
					const bodyContentMatch = responseText.match(
						/<body.*?>(.*?)<\/body>/is,
					);
					const html = String(bodyContentMatch ? bodyContentMatch[1] : "");
					return {
						kind: "confirmation",
						html,
						formData,
					};
				}
			}
			console.error(`Post request to ${postCgiUrl} failed:`, error);
			if (error instanceof Error) {
				return { kind: "error", message: error.message };
			}
			throw error;
		}
	}

	async getBBSMenu(menuUrl: string): Promise<BBSMenu> {
		try {
			const buffer = await this.fetchWithRetry(menuUrl);
			const text = this.decodeBuffer(buffer);
			return this.parser.parseBBSMenu(text);
		} catch (error) {
			console.error(`Failed to get bbsmenu from ${menuUrl}:`, error);
			throw error;
		}
	}
}
