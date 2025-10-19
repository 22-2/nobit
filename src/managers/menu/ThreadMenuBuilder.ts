import type { Menu } from "obsidian";
import { ICON_BOARD } from "src/utils/constants";
import { parseBbsUrl } from "../../lib/libch/url";
import type { SubjectItem, Thread } from "../../lib/types";

/**
 * Information required to build thread context menu
 */
export interface ThreadMenuInfo {
	host: string;
	board: string;
	threadId: string;
	title: string;
}

/**
 * ThreadMenuBuilder encapsulates the logic for building thread context menus.
 * This class handles all Obsidian Menu API interactions, keeping Svelte components clean.
 */
export class ThreadMenuBuilder {
	constructor(
		private showNotice: (message: string) => void,
		private openBoard: (host: string, board: string) => Promise<void>,
		private openThread: (url: string) => Promise<void>,
	) {}

	/**
	 * Build and populate a context menu for a thread item.
	 * @param menu - The Obsidian Menu instance to populate
	 * @param info - Thread information needed for menu actions
	 * @param threadData - Optional full thread data for "copy full thread" feature
	 */
	buildThreadMenu(
		menu: Menu,
		info: ThreadMenuInfo,
		threadData?: Thread | null,
	): void {
		const url = `https://${info.host}/test/read.cgi/${info.board}/${info.threadId}/`;

		// Open thread action
		// menu.addItem((item) => {
		// 	item.setTitle("スレッドを開く")
		// 		.setIcon("messages-square")
		// 		.onClick(async () => {
		// 			await this.openThread(url);
		// 		});
		// });

		// Open board action
		menu.addItem((item) => {
			item.setTitle("板を開く")
				.setIcon(ICON_BOARD)
				.onClick(async () => {
					await this.openBoard(info.host, info.board);
				});
		});

		menu.addSeparator();

		// Copy submenu
		menu.addItem((item) => {
			const copySubmenu = (item as any)
				.setTitle("コピー")
				.setIcon("copy")
				.setSubmenu() as Menu;

			copySubmenu.addItem((subItem) =>
				subItem
					.setTitle("スレタイとURL")
					.setIcon("copy")
					.onClick(() => {
						navigator.clipboard.writeText(`${info.title}\n${url}`);
						this.showNotice("スレタイとURLをコピーしました");
					}),
			);

			copySubmenu.addItem((subItem) =>
				subItem
					.setTitle("スレタイ")
					.setIcon("copy")
					.onClick(() => {
						navigator.clipboard.writeText(info.title);
						this.showNotice("スレタイをコピーしました");
					}),
			);

			copySubmenu.addItem((subItem) =>
				subItem
					.setTitle("URL")
					.setIcon("link")
					.onClick(() => {
						navigator.clipboard.writeText(url);
						this.showNotice("URLをコピーしました");
					}),
			);

			// Add "Copy full thread" if thread data is available
			if (threadData) {
				copySubmenu.addSeparator();
				copySubmenu.addItem((subItem) =>
					subItem
						.setTitle("スレッド全文")
						.setIcon("copy-plus")
						.onClick(async () => {
							try {
								const header = `${threadData.title}\n${url}\n`;
								const postsText = threadData.posts
									.map((post, index) => {
										const postNumber = index + 1;
										const authorName = post.authorName;
										const mail = post.mail
											? ` ${post.mail}`
											: "";
										const date = this.formatDate(post.date);
										const authorId = post.authorId || "???";
										const content = post.content
											.replace(/<br\s*\/?>/gi, "\n")
											.replace(/<[^>]+>/g, "");

										return `${postNumber}: ${authorName}${mail}  ${date} ID:${authorId}\n${content}`;
									})
									.join("\n\n");

								const fullText = header + "\n" + postsText;

								await navigator.clipboard.writeText(fullText);
								this.showNotice("スレッド全文をコピーしました");
							} catch (error) {
								this.showNotice(
									"コピーに失敗: スレッドデータの処理中にエラーが発生しました",
								);
								console.error(
									"Failed to copy full thread:",
									error,
								);
							}
						}),
				);
			}
		});

		menu.addSeparator();

		// Open in browser action
		menu.addItem((item) =>
			item
				.setTitle("ブラウザで開く")
				.setIcon("external-link")
				.onClick(() => {
					window.open(url, "_blank");
				}),
		);
	}

	/**
	 * Extract ThreadMenuInfo from a SubjectItem and board URL.
	 * @param thread - The thread item from the board list
	 * @param boardUrl - The current board URL
	 * @returns ThreadMenuInfo or null if parsing fails
	 */
	extractThreadInfo(
		thread: SubjectItem,
		boardUrl: string,
	): ThreadMenuInfo | null {
		const parsed = parseBbsUrl(boardUrl);
		if (!parsed) {
			console.error(`Cannot parse board URL: ${boardUrl}`);
			return null;
		}

		return {
			host: parsed.host,
			board: parsed.board,
			threadId: thread.id,
			title: thread.title,
		};
	}

	/**
	 * Extract ThreadMenuInfo from a Thread object.
	 * @param thread - The thread object
	 * @returns ThreadMenuInfo or null if parsing fails
	 */
	extractThreadInfoFromThread(thread: Thread): ThreadMenuInfo | null {
		const parsed = parseBbsUrl(thread.url);
		if (!parsed) {
			console.error(`Cannot parse thread URL: ${thread.url}`);
			return null;
		}

		return {
			host: parsed.host,
			board: parsed.board,
			threadId: parsed.threadId || "",
			title: thread.title,
		};
	}

	/**
	 * Format date for display.
	 * @param date - Date object to format
	 * @returns Formatted date string
	 */
	private formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");
		const seconds = String(date.getSeconds()).padStart(2, "0");

		return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
	}
}
