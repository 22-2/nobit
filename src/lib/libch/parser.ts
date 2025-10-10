// E:\Desktop\coding\my-projects-02\nobit\src\lib\libch\parser.ts
import { isValid, parse } from "date-fns";
import he from "he";
import type {
    BBSMenu,
    BBSMenuCategory,
    Post,
    SubjectItem,
    Thread,
} from "../types";
import {
    BBSMenuSchema,
    PostSchema,
    SubjectItemSchema,
    ThreadSchema,
} from "../types";
import { invariant, normalizeDateStr } from "./utils";

// ========================================
// Parser Interface
// ========================================
export interface Parser {
	parseThread(dat: string, threadId: string, url: string): Thread | undefined;
	parseSubject(subjectTxt: string): SubjectItem[];
	parseBBSMenu(html: string): BBSMenu;
}

// ========================================
// Base Parser (共通ロジック)
// ========================================
export abstract class BaseParser implements Parser {
	protected static readonly DATE_FORMATS = {
		talkfm: "yyyy/MM/dd HH:mm:ss.SSS",
		fivechfm: "yyyy/MM/dd HH:mm:ss.SS",
		oldfm: "yyyy/MM/dd HH:mm:ss",
	} as const;

	protected decodeHtmlEntities(str: string): string {
		return he.decode(str);
	}

	protected parseDate(rawDateStr: string, resNum?: number): Date {
		if (!rawDateStr) {
			return new Date();
		}

		const dateStr = normalizeDateStr(rawDateStr);
		this.onDateParsing?.(resNum, rawDateStr, dateStr);

		for (const [formatName, format] of Object.entries(
			BaseParser.DATE_FORMATS
		)) {
			const parsedDate = parse(dateStr, format, new Date());
			if (isValid(parsedDate)) {
				this.onDateParseSuccess?.(resNum, dateStr, formatName);
				return parsedDate;
			}
			this.onDateParseAttempt?.(resNum, formatName, false);
		}

		this.onDateParseFailure?.(resNum, rawDateStr, dateStr);
		throw new Error(
			`ParseError: Failed to parse date. Raw: "${rawDateStr}", Normalized: "${dateStr}".`
		);
	}

	protected parsePost(
		postStr: string,
		resNum: number
	): Omit<
		Post,
		| "references"
		| "replies"
		| "hasImage"
		| "hasExternalLink"
		| "postIdCount"
		| "siblingPostNumbers"
		| "imageUrls"
	> | null {
		const trimmedPostStr = postStr.trim();
		if (!trimmedPostStr) return null;

		try {
			const splitParts = trimmedPostStr.split("<>");
			const dateAndIdIdx = splitParts.findIndex((str) =>
				str.includes("ID:")
			);

			if (dateAndIdIdx < 2 || dateAndIdIdx + 1 >= splitParts.length) {
				this.onPostParseError?.(resNum, "Invalid structure", {
					dateAndIdIdx,
					partsLength: splitParts.length,
				});
				return null;
			}

			const authorName = (splitParts[0]?.trim() || "").replace(
				/<.*?>/g,
				""
			);
			const mail = splitParts[1]?.trim() || "";
			const rawContent = splitParts[dateAndIdIdx + 1]?.trim() || "";
			const content = rawContent
				.replace(/<a\s+href=[^>]*?be\.2ch\.net[^>]*?>.*?<\/a>/i, "")
				.trim();

			const headerPart = splitParts[dateAndIdIdx];
			invariant(headerPart, "failed to parse header");

			const headerSplit = headerPart.split("ID:");
			const rawDateStr = headerSplit[0]?.trim();
			const authorId =
				headerSplit.length > 1
					? headerSplit.slice(1).join("ID:").trim()
					: "";

			const date = this.parseDate(rawDateStr || "", resNum);

			this.onPostParseSuccess?.(resNum);
			return {
				resNum,
				authorName,
				mail,
				date,
				content,
				authorId,
			};
		} catch (error) {
			this.onPostParseError?.(
				resNum,
				error instanceof Error ? error.message : String(error),
				{ postStr: postStr.substring(0, 100) }
			);
			return null;
		}
	}

	protected buildIdPostMap(posts: Post[]): Map<string, number[]> {
		const idPostMap = new Map<string, number[]>();
		posts.forEach((post, index) => {
			if (post.authorId) {
				const resNumber = index + 1;
				if (!idPostMap.has(post.authorId)) {
					idPostMap.set(post.authorId, []);
				}
				idPostMap.get(post.authorId)!.push(resNumber);
			}
		});
		return idPostMap;
	}

	protected buildReferences(
		posts: Post[],
		threadId: string,
		idPostMap: Map<string, number[]>
	): void {
		posts.forEach((post, index) => {
			const resNumber = index + 1;

			// ID情報の付与
			if (post.authorId) {
				const siblingPosts = idPostMap.get(post.authorId) || [];
				post.postIdCount = siblingPosts.length;
				post.siblingPostNumbers = siblingPosts;
			}

			const decodedContent = this.decodeHtmlEntities(post.content);
			const anchorRegex = />>(\d+)/g;
			let match;

			while ((match = anchorRegex.exec(decodedContent)) !== null) {
				const strNum = match[1];
				if (!strNum) continue;

				const targetResNumber = parseInt(strNum, 10);
				const targetIndex = targetResNumber - 1;

				if (targetIndex >= 0 && targetIndex < posts.length) {
					const targetPost = posts[targetIndex]!;
					if (!post.references.includes(targetResNumber)) {
						post.references.push(targetResNumber);
					}
					if (!targetPost.replies.includes(resNumber)) {
						targetPost.replies.push(resNumber);
					}
				}
			}

			this.transformPostContent(post, decodedContent, threadId);
		});
	}

	protected transformPostContent(
		post: Post,
		decodedContent: string,
		threadId: string
	): void {
		const contentParts = decodedContent.split(
			/(>>\d+|<br>|https?:\/\/[^\s<>"']+)/
		);
		const imageUrls: string[] = [];

		const processedContent = contentParts
			.map((part) => {
				if (!part) return "";

				if (part.startsWith(">>")) {
					const resNum = part.substring(2);
					const escapedPart = part.replace(/>/g, "&gt;");
					return `<a class="internal-res-link" data-thread-id="${threadId}" data-res-number="${resNum}">${escapedPart}</a>`;
				}

				if (part.startsWith("http")) {
					const url = part;
					if (/\.(jpg|jpeg|png|gif)$/i.test(url)) {
						post.hasImage = true;
						if (!imageUrls.includes(url)) {
							imageUrls.push(url);
						}
					}
					post.hasExternalLink = true;
					return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="external-link">${url}</a>`;
				}

				if (part === "<br>") {
					return "<br />";
				}

				return part;
			})
			.join("");

		post.content = processedContent;
		post.imageUrls = imageUrls;
	}

	public parseThread(
		dat: string,
		threadId: string,
		url: string
	): Thread | undefined {
		console.log('🔍 Parser: Starting to parse thread', {
			datLength: dat?.length,
			threadId,
			url,
			datPreview: dat?.substring(0, 200)
		});

		this.onThreadParseStart?.(dat.length);

		if (!dat?.trim().length) {
			console.log('❌ Parser: Empty dat content');
			this.onThreadParseEmpty?.();
			return undefined;
		}

		const lines = dat.trim().split("\n");
		console.log('✅ Parser: Split into lines', { lineCount: lines.length, firstLine: lines[0]?.substring(0, 100) });
		this.onThreadParseLinesCount?.(lines.length);

		invariant(!!lines.length && !!lines[0], "No posts found");

		const firstLineParts = lines[0].split("<>");
		const rawTitle =
			firstLineParts.length > 5 ? firstLineParts?.[5]?.trim() : "無題";
		invariant(rawTitle, "failed to parse title");

		const title = this.decodeHtmlEntities(rawTitle);
		this.onThreadParseTitle?.(title);

		const postsToProcess = lines.slice(0, 1000);
		this.onThreadParseProcessingCount?.(postsToProcess.length);

		// 1st Pass: 基本的なパース
		const initialPosts: Post[] = postsToProcess
			.map((postStr, index) => {
				try {
					const post = this.parsePost(postStr, index + 1);
					let fullPost: Post;

					if (!post) {
						fullPost = {
							resNum: index + 1,
							authorName: "",
							mail: "",
							date: new Date(),
							content: postStr,
							authorId: "",
							references: [],
							replies: [],
							hasImage: false,
							hasExternalLink: false,
							postIdCount: 0,
							siblingPostNumbers: [],
							imageUrls: [],
						};
					} else {
						fullPost = {
							...post,
							references: [],
							replies: [],
							hasImage: false,
							hasExternalLink: false,
							postIdCount: 0,
							siblingPostNumbers: [],
							imageUrls: [],
						};
					}

					return PostSchema.parse(fullPost);
				} catch (err) {
					console.error(
						"投稿のパースに失敗しました:",
						err,
						"投稿文字列:",
						postStr
					);
					return null;
				}
			})
			.filter((p): p is Post => p !== null);

		// 2nd Pass: ID集計と参照関係の構築
		const idPostMap = this.buildIdPostMap(initialPosts);
		this.buildReferences(initialPosts, threadId, idPostMap);

		const thread = {
			id: threadId,
			title,
			posts: initialPosts,
			url,
		};

		return ThreadSchema.parse(thread);
	}

	public parseSubject(subjectTxt: string): SubjectItem[] {
		if (!subjectTxt?.trim()) {
			return [];
		}

		const lines = subjectTxt.trim().split(/\r?\n/);
		const items: SubjectItem[] = [];

		for (const line of lines) {
			const match = line.match(/^(\d{10})\.dat<>(.+?)\s+\((\d{1,4})\)$/);

			if (match) {
				const [, id, title, resCountStr] = match;
				const resCount = parseInt(resCountStr!, 10);

				if (id && title && !isNaN(resCount)) {
					items.push({
						id,
						title: this.decodeHtmlEntities(title.trim()),
						resCount,
					});
				}
			}
		}

		return items.map((item) => SubjectItemSchema.parse(item));
	}

	public parseBBSMenu(html: string): BBSMenu {
		const lines = html.split(/\r?\n/);
		const menu: BBSMenu = [];
		let currentCategory: BBSMenuCategory | null = null;

		const categoryRegex = /<BR><BR><B>(.*?)<\/B><BR>/i;
		const boardRegex = /<A HREF=(.*?)>(.*?)<\/A>/i;

		for (const line of lines) {
			const trimmedLine = line.trim();
			if (!trimmedLine) continue;

			const categoryMatch = trimmedLine.match(categoryRegex);
			if (categoryMatch && categoryMatch[1]) {
				currentCategory = {
					name: this.decodeHtmlEntities(categoryMatch[1].trim()),
					boards: [],
				};
				menu.push(currentCategory);
				continue;
			}

			if (currentCategory) {
				const boardMatch = trimmedLine.match(boardRegex);
				if (boardMatch && boardMatch[1] && boardMatch[2]) {
					const url = boardMatch[1].trim().replace(/^"|"$/g, "");
					const name = this.decodeHtmlEntities(boardMatch[2].trim());

					if (
						url &&
						name &&
						!url.includes("index.html") &&
						!url.endsWith("../") &&
						!name.toLowerCase().includes("top")
					) {
						currentCategory.boards.push({ name, url });
					}
				}
			}
		}

		const filteredMenu = menu.filter(
			(category) => category.boards.length > 0
		);
		return BBSMenuSchema.parse(filteredMenu);
	}

	// Hook methods for debugging (オーバーライド可能)
	protected onThreadParseStart?(contentLength: number): void;
	protected onThreadParseEmpty?(): void;
	protected onThreadParseLinesCount?(count: number): void;
	protected onThreadParseTitle?(title: string): void;
	protected onThreadParseProcessingCount?(count: number): void;
	protected onDateParsing?(
		resNum: number | undefined,
		raw: string,
		normalized: string
	): void;
	protected onDateParseAttempt?(
		resNum: number | undefined,
		format: string,
		success: boolean
	): void;
	protected onDateParseSuccess?(
		resNum: number | undefined,
		dateStr: string,
		format: string
	): void;
	protected onDateParseFailure?(
		resNum: number | undefined,
		raw: string,
		normalized: string
	): void;
	protected onPostParseSuccess?(resNum: number): void;
	protected onPostParseError?(
		resNum: number,
		error: string,
		context?: any
	): void;
}

// ========================================
// Default Parser (本番用)
// ========================================
export class DefaultParser extends BaseParser {
	// デフォルト実装はそのまま使用
}

// ========================================
// Debug Parser (デバッグ用)
// ========================================
export class DebugParser extends BaseParser {
	private verboseLogging = true;
	private successCount = 0;
	private errorCount = 0;

	protected onThreadParseStart(contentLength: number): void {
		console.log(
			`DEBUG: Starting thread parsing, content length: ${contentLength}`
		);
		this.successCount = 0;
		this.errorCount = 0;
	}

	protected onThreadParseEmpty(): void {
		console.log(`DEBUG: Empty content`);
	}

	protected onThreadParseLinesCount(count: number): void {
		console.log(`DEBUG: Total lines: ${count}`);
		if (count > 100) {
			this.verboseLogging = false;
			console.log(
				`DEBUG: Large dataset detected, reducing log verbosity`
			);
		}
	}

	protected onThreadParseTitle(title: string): void {
		console.log(`DEBUG: Thread title: "${title}"`);
	}

	protected onThreadParseProcessingCount(count: number): void {
		console.log(`DEBUG: Processing ${count} posts`);
	}

	protected onDateParsing(
		resNum: number | undefined,
		raw: string,
		normalized: string
	): void {
		if (this.verboseLogging && resNum) {
			console.log(
				`DEBUG: Post ${resNum} - Parsing date: "${raw}" -> "${normalized}"`
			);
		}
	}

	protected onDateParseAttempt(
		resNum: number | undefined,
		format: string,
		success: boolean
	): void {
		if (this.verboseLogging && resNum && !success) {
			console.log(`DEBUG: Post ${resNum} - ${format} failed`);
		}
	}

	protected onDateParseSuccess(
		resNum: number | undefined,
		dateStr: string,
		format: string
	): void {
		if (this.verboseLogging && resNum) {
			console.log(
				`DEBUG: Post ${resNum} - Date parsed successfully with ${format}`
			);
		}
	}

	protected onDateParseFailure(
		resNum: number | undefined,
		raw: string,
		normalized: string
	): void {
		if (this.verboseLogging && resNum) {
			console.log(
				`DEBUG: Post ${resNum} - All date formats failed for: "${raw}" -> "${normalized}"`
			);
		}
	}

	protected onPostParseSuccess(resNum: number): void {
		this.successCount++;
		if (this.verboseLogging) {
			console.log(`DEBUG: Post ${resNum} - SUCCESS`);
		}
	}

	protected onPostParseError(
		resNum: number,
		error: string,
		context?: any
	): void {
		this.errorCount++;
		if (this.verboseLogging) {
			console.log(`DEBUG: Post ${resNum} - ERROR: ${error}`);
			if (context?.postStr) {
				console.log(
					`DEBUG: Post ${resNum} - Content: ${context.postStr}...`
				);
			}
			if (context?.dateAndIdIdx !== undefined) {
				console.log(
					`DEBUG: Post ${resNum} - Invalid structure, dateAndIdIdx=${context.dateAndIdIdx}, parts=${context.partsLength}`
				);
			}
		}
	}

	public parseThread(
		dat: string,
		threadId: string,
		url: string
	): Thread | undefined {
		const result = super.parseThread(dat, threadId, url);
		console.log(
			`DEBUG: Parsing summary - Success: ${this.successCount}, Errors: ${this.errorCount}`
		);
		return result;
	}
}
