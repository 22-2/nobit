import { z } from "zod";

// packages/libch/src/types.ts

export const PostSchema = z.object({
	resNum: z.number(),
	authorName: z.string(),
	mail: z.string(),
	authorId: z.string(),
	/**
	 * パーサーによってアンカー(>>1)が<a>タグに変換済みのHTML文字列。
	 * コンポーネント側ではこれをそのまま {@html} で表示します。
	 */
	content: z.string(),
	date: z.date(),
	/** このレスが参照しているレス番号の配列 (例: [10, 25]) */
	references: z.array(z.number()),
	/** このレスから返信されている（被参照）レス番号の配列 (例: [100, 123]) */
	replies: z.array(z.number()),
	hasImage: z.boolean(),
	hasExternalLink: z.boolean(),
	/** この投稿のIDがスレッド内で書き込んだ総数 */
	postIdCount: z.number(),
	/** この投稿のIDが書き込んだレス番号の配列（自分自身も含む） */
	siblingPostNumbers: z.array(z.number()),
	/** この投稿に含まれる画像のURLの配列 */
	imageUrls: z.array(z.string()).optional(),
});

export type Post = z.infer<typeof PostSchema>;

export const ThreadFiltersSchema = z.object({
	popular: z.boolean(),
	image: z.boolean(),
	video: z.boolean(),
	external: z.boolean(),
	internal: z.boolean(),
	searchText: z.string(),
});

export type ThreadFilters = z.infer<typeof ThreadFiltersSchema>;

export const ThreadSchema = z.object({
	id: z.string(),
	title: z.string(),
	posts: z.array(PostSchema),
	url: z.string(),
});

export type Thread = z.infer<typeof ThreadSchema>;

export const SubjectItemSchema = z.object({
	id: z.string(), // スレッドID (unixtime)
	title: z.string(),
	resCount: z.number(),
});

export type SubjectItem = z.infer<typeof SubjectItemSchema>;

export const BoardSchema = z.object({
	name: z.string(),
	url: z.string(),
});

export type Board = z.infer<typeof BoardSchema>;

export const BBSMenuCategorySchema = z.object({
	name: z.string(),
	boards: z.array(BoardSchema),
});

export type BBSMenuCategory = z.infer<typeof BBSMenuCategorySchema>;

export const BBSMenuSchema = z.array(BBSMenuCategorySchema);

export type BBSMenu = z.infer<typeof BBSMenuSchema>;

// --- 書き込み関連の型 ---
export const PostDataSchema = z.object({
	name: z.string(),
	mail: z.string(),
	content: z.string(),
});

export type PostData = z.infer<typeof PostDataSchema>;

export const SuccessPostResultSchema = z.object({
	kind: z.literal("success"),
	message: z.string(),
});

export const ErrorPostResultSchema = z.object({
	kind: z.literal("error"),
	message: z.string(),
});

export const ConfirmationPostResultSchema = z.object({
	kind: z.literal("confirmation"),
	/** 確認画面のHTMLコンテンツ */
	html: z.string(),
	/** 再投稿に必要なフォームデータ */
	formData: z.record(z.string(), z.string()),
});

export const PostResultSchema = z.discriminatedUnion("kind", [
	SuccessPostResultSchema,
	ErrorPostResultSchema,
	ConfirmationPostResultSchema,
]);

export type SuccessPostResult = z.infer<typeof SuccessPostResultSchema>;
export type ErrorPostResult = z.infer<typeof ErrorPostResultSchema>;
export type ConfirmationPostResult = z.infer<
	typeof ConfirmationPostResultSchema
>;
export type PostResult = z.infer<typeof PostResultSchema>;


export type SortDirection = "asc" | "desc";
/** ソーターの状態 */

export type ColumnKey = keyof ThreadFilters;

export type SorterState<T = any> = {
    sortKey: ColumnKey | null;
    sortDirection: SortDirection;
};
export type SorterStore<T = any> = SorterState<T> & {
    sortedItems: () => T[];
    setSort: (newKey: string) => void;
};

/**
 * ソート可能なカラムの設定
 * @template T - ソート対象のアイテムの型
 */
export type SortColumn<T> = {
    /** 昇順でソートするための比較関数 */
    compare: (a: T, b: T) => number;
    /** このキーが選択されたときのデフォルトのソート方向 */
    defaultDirection?: SortDirection;
};
/**
 * useSorterに渡すカラム設定の型
 * @template T - ソート対象のアイテムの型
 */

export type SorterColumns<T> = {
    [key: string]: SortColumn<T>;
};
