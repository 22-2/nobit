// E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\stores\types.ts
import type { Thread } from "@nobit/libch/core/types";
import type {
    PostResult,
    SubjectItem,
    VisibleColumns,
    ColumnKey,
} from "../types";
import { type BBSProvider } from "@nobit/libch/core/provider";
import type { PostData } from "@nobit/libch/core/types";

// --- 依存関係のインターフェース定義 (既存の定義は変更なし)
export interface IThreadService {
    post(
        threadUrl: string,
        postData: PostData,
        headers: Record<string, string>,
        confirmationData?: Record<string, any>
    ): Promise<PostResult>;
}
export interface INotifier {
    (message: string): void;
}
export interface ILogger {
    info(...message: any): void;
    warn(...message: any): void;
    error(...message: any): void;
}

// --- ストアごとの依存関係を定義
export interface ThreadDataStoreDependencies {
    initialThread: ThreadIdentifier;
    provider: BBSProvider;
    logger: ILogger;
}
export interface PostFormStoreDependencies {
    threadService: IThreadService;
    notifier: INotifier;
    logger: ILogger;
    /** 現在のスレッドURLを取得する関数 */
    getThreadUrl: () => string | undefined;
    /** 投稿成功時に実行されるコールバック (通常はスレッドの再読み込み) */
    onPostSuccess: () => Promise<void>;
}

// --- 状態と引数の型定義 ---

/** スレッドデータストアの状態 */
export interface ThreadDataState {
    isLoading: boolean;
    error: string | null;
    autoReload: boolean;
    autoReloadInterval: number;
    autoScroll: boolean;
    isSubmitting: boolean; // ★ 投稿中の状態を追加
}

/** 投稿フォームストアの状態 */
export interface PostFormState {
    postData: PostData | null;
    isInlineFormVisible: boolean;
    isSubmitting: boolean;
    isConfirmationVisible: boolean;
    confirmationHtml: string;
    confirmationData: Record<string, string> | null;
}

export type ThreadIdentifier = Pick<Thread, "url" | "title"> &
    Partial<Omit<Thread, "url" | "title">>;

/**
 * handleAsyncOperationのオプションの型。
 * OperationResultからリネームして役割を明確化。
 */
export type AsyncOperationOptions<T = any> = {
    loadingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
    onStart?: () => void;
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
    onFinally?: () => void;
};

/** ★ 操作の結果を示すシンプルな型を新設 */
export interface SimpleOperationResult {
    success: boolean;
    error?: string;
}

// --- 以下の定義は既存のまま ---
export interface IBoardProvider {
    getThreads(url: string): Promise<SubjectItem[]>;
    getBoardTitle(url: string): Promise<string>;
}
export interface ISettingsSaver {
    save(
        settings: Partial<{
            sortKey: "index" | "title" | "resCount" | "ikioi";
            sortDirection: "asc" | "desc";
            visibleColumns: VisibleColumns;
        }>
    ): Promise<void>;
}

export interface ILogger {
    warn(message: string, ...optionalParams: any[]): void;
    error(message: string, ...optionalParams: any[]): void;
}

export interface BoardDataStoreDependencies {
    initialUrl: string;
    provider: IBoardProvider;
    logger: ILogger;
}
export interface BoardUIStoreDependencies {
    initialSortState: SorterState;
    initialVisibleColumns: VisibleColumns;
    settingsSaver: ISettingsSaver;
}

// --- 状態の型定義 ---

export interface BoardDataState {
    title: string | null;
    currentUrl: string;
    threads: SubjectItem[];
    isLoading: boolean;
    error: string | null;
}
export interface BoardUIState {
    visibleColumns: VisibleColumns;
    sortState: SorterState;
}

// --- その他 ---

export type TableSortKey = "index" | "title" | "resCount" | "ikioi";
export interface TableHeaderItem {
    key: TableSortKey;
    label: string;
    disabled?: boolean;
}
export type SortDirection = "asc" | "desc";
/** ソーターの状態 */

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
