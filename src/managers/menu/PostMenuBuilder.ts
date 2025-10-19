import type { Menu } from "obsidian";
import type { Post } from "../../lib/types";

/**
 * Information required to build post context menu
 */
export interface PostMenuInfo {
	host: string;
	board: string;
	threadId: string;
	threadTitle: string;
	post: Post;
	index: number;
}

/**
 * PostMenuBuilder encapsulates the logic for building post context menus.
 * This class handles all Obsidian Menu API interactions, keeping Svelte components clean.
 */
export class PostMenuBuilder {
	constructor(private showNotice: (message: string) => void) {}

	/**
	 * Build and populate a context menu for a post item.
	 * @param menu - The Obsidian Menu instance to populate
	 * @param info - Post information needed for menu actions
	 */
	buildPostMenu(menu: Menu, info: PostMenuInfo): void {
		const postNumber = info.index + 1;
		const url = `https://${info.host}/test/read.cgi/${info.board}/${info.threadId}/${postNumber}`;

		// Copy post action
		menu.addItem((item) =>
			item
				.setTitle("コピー")
				.setIcon("copy")
				.onClick(() => {
					const rawContent = info.post.content
						.replace(/<br\s*\/?>/gi, "\n")
						.replace(/<[^>]+>/g, "");

					const date = this.formatDate(info.post.date);
					const authorId = info.post.authorId || "???";

					const copyText = `${info.threadTitle}\n${url}\n${postNumber} ${info.post.authorName}  ${date} ID:${authorId}\n${rawContent}`;

					navigator.clipboard.writeText(copyText);
					this.showNotice("レスをコピーしました");
				}),
		);

		menu.addSeparator();

		// Copy submenu for more options
		menu.addItem((item) => {
			const copySubmenu = (item as any)
				.setTitle("細かいコピー")
				.setIcon("copy")
				.setSubmenu() as Menu;

			copySubmenu.addItem((subItem) =>
				subItem
					.setTitle("本文のみ")
					.setIcon("file-text")
					.onClick(() => {
						const rawContent = info.post.content
							.replace(/<br\s*\/?>/gi, "\n")
							.replace(/<[^>]+>/g, "");
						navigator.clipboard.writeText(rawContent);
						this.showNotice("本文をコピーしました");
					}),
			);

			copySubmenu.addItem((subItem) =>
				subItem
					.setTitle("IDのみ")
					.setIcon("id-card")
					.onClick(() => {
						navigator.clipboard.writeText(info.post.authorId);
						this.showNotice("IDをコピーしました");
					}),
			);

			copySubmenu.addItem((subItem) =>
				subItem
					.setTitle("レスURL")
					.setIcon("link")
					.onClick(() => {
						navigator.clipboard.writeText(url);
						this.showNotice("レスURLをコピーしました");
					}),
			);
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
