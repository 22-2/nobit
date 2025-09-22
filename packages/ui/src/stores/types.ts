// --- 依存関係のインターフェース定義

import type {
    Thread,
    PostData,
    PostResult,
    SubjectItem,
    VisibleColumns,
    ColumnKey,
} from "../types";

export interface IBBSProvider {
    getThread(url: string): Promise<Thread>;
}

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
    info(message: string, ...optionalParams: any[]): void;
    warn(message: string, ...optionalParams: any[]): void;
    error(message: string, ...optionalParams: any[]): void;
}

// --- ストアごとの依存関係を定義 (新規) ---

export interface ThreadDataStoreDependencies {
    initialThread: ThreadIdentifier;
    bbsProvider: IBBSProvider;
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
    thread: Thread | null;
    isLoading: boolean;
    error: string | null;
    autoReload: boolean;
    autoReloadInterval: number;
    autoScroll: boolean;
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

export type OperationResult<T = any> = {
    loadingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
    onStart?: () => void;
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
    onFinally?: () => void;
};

// --- 依存関係のインターフェース定義 ---

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
    boardProvider: IBoardProvider;
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
