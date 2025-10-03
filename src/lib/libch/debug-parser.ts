// Debug version of DefaultParser to identify parsing issues
import { isValid, parse } from "date-fns";
import he from "he";
import type { Post, Thread } from "../types";
import { PostSchema, ThreadSchema } from "../types";
import { invariant, normalizeDateStr } from "./utils";

export class DebugParser {
	private static readonly talkfm = "yyyy/MM/dd HH:mm:ss.SSS";
	private static readonly fivechfm = "yyyy/MM/dd HH:mm:ss.SS";
	private static readonly oldfm = "yyyy/MM/dd HH:mm:ss";
	private verboseLogging = true;

	private decodeHtmlEntities(str: string): string {
		return he.decode(str);
	}

	private parsePost(
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
			const dateAndIdIdx = splitParts.findIndex((str) => str.includes("ID:"));

			if (dateAndIdIdx < 2 || dateAndIdIdx + 1 >= splitParts.length) {
				if (this.verboseLogging) {
					console.log(`DEBUG: Post ${resNum} - Invalid structure, dateAndIdIdx=${dateAndIdIdx}, parts=${splitParts.length}`);
				}
				return null;
			}

			// <b>タグなどを除去
			const authorName = (splitParts[0]?.trim() || "").replace(/<.*?>/g, "");
			const mail = splitParts[1]?.trim() || "";
			const rawContent = splitParts[dateAndIdIdx + 1]?.trim() || "";
			// beリンクなどの不要なaタグを除去
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

			let date: Date;
			if (!rawDateStr) {
				date = new Date();
			} else {
				const dateStr = normalizeDateStr(rawDateStr);
				if (this.verboseLogging) {
					console.log(`DEBUG: Post ${resNum} - Parsing date: "${rawDateStr}" -> "${dateStr}"`);
				}
				
				let parsedDate = parse(dateStr, DebugParser.talkfm, new Date());
				if (!isValid(parsedDate)) {
					if (this.verboseLogging) {
						console.log(`DEBUG: Post ${resNum} - talkfm failed, trying fivechfm`);
					}
					parsedDate = parse(dateStr, DebugParser.fivechfm, new Date());
				}
				if (!isValid(parsedDate)) {
					if (this.verboseLogging) {
						console.log(`DEBUG: Post ${resNum} - fivechfm failed, trying oldfm`);
					}
					parsedDate = parse(dateStr, DebugParser.oldfm, new Date());
				}

				if (!isValid(parsedDate)) {
					if (this.verboseLogging) {
						console.log(`DEBUG: Post ${resNum} - All date formats failed for: "${rawDateStr}" -> "${dateStr}"`);
					}
					throw new Error(
						`ParseError: Failed to parse date. Raw: "${rawDateStr}", Normalized: "${dateStr}".`
					);
				}
				date = parsedDate;
				if (this.verboseLogging) {
					console.log(`DEBUG: Post ${resNum} - Date parsed successfully: ${date.toISOString()}`);
				}
			}

			if (this.verboseLogging) {
				console.log(`DEBUG: Post ${resNum} - SUCCESS`);
			}
			return {
				resNum,
				authorName,
				mail,
				date,
				content,
				authorId,
			};
		} catch (error) {
			if (this.verboseLogging) {
				console.log(`DEBUG: Post ${resNum} - ERROR: ${error instanceof Error ? error.message : String(error)}`);
				console.log(`DEBUG: Post ${resNum} - Content: ${postStr.substring(0, 100)}...`);
			}
			return null;
		}
	}

	public parseThread(
		dat: string,
		threadId: string,
		url: string
	): Thread | undefined {
		console.log(`DEBUG: Starting thread parsing, content length: ${dat.length}`);
		
		if (!dat?.trim().length) {
			console.log(`DEBUG: Empty content`);
			return undefined;
		}

		const lines = dat.trim().split("\n");
		console.log(`DEBUG: Total lines: ${lines.length}`);
		
		// Disable verbose logging for large datasets
		if (lines.length > 100) {
			this.verboseLogging = false;
			console.log(`DEBUG: Large dataset detected, reducing log verbosity`);
		}
		
		invariant(!!lines.length && !!lines[0], "No posts found");

		const firstLineParts = lines[0].split("<>");
		const rawTitle =
			firstLineParts.length > 4 ? firstLineParts?.[4]?.trim() : "無題";

		invariant(rawTitle, "failed to parse title");

		const title = this.decodeHtmlEntities(rawTitle);
		console.log(`DEBUG: Thread title: "${title}"`);

		const postsToProcess = lines.slice(0, 1000);
		console.log(`DEBUG: Processing ${postsToProcess.length} posts`);

		// 1st Pass: 基本的なパースとID集計
		const idPostMap = new Map<string, number[]>();
		let successCount = 0;
		let errorCount = 0;
		
		const initialPosts: Post[] = postsToProcess
			.map((postStr, index) => {
				try {
					const post = this.parsePost(postStr, index + 1);
					let fullPost: Post;
					
					if (!post) {
						if (this.verboseLogging) {
							console.log(`DEBUG: Post ${index + 1} - Returned null`);
						}
						errorCount++;
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
						successCount++;
						// IDごとのレス番号を記録
						if (post.authorId) {
							const resNumber = index + 1;
							if (!idPostMap.has(post.authorId)) {
								idPostMap.set(post.authorId, []);
							}
							idPostMap.get(post.authorId)!.push(resNumber);
						}

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

					// Validate the post with zod schema
					return PostSchema.parse(fullPost);
				} catch (err) {
					console.error(
						`DEBUG: Post ${index + 1} - Schema validation failed:`,
						err,
						"投稿文字列:",
						postStr.substring(0, 100)
					);
					errorCount++;
					return null;
				}
			})
			.filter((p): p is Post => p !== null);

		console.log(`DEBUG: Parsing summary - Success: ${successCount}, Errors: ${errorCount}, Final posts: ${initialPosts.length}`);

		// Skip the rest of the processing for debugging
		const thread = {
			id: threadId,
			title,
			posts: initialPosts,
			url,
		};

		// Validate the thread data with zod schema
		return ThreadSchema.parse(thread);
	}
}