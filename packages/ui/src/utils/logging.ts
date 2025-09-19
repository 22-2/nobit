// --- 変更点(1): ログレベルの定義を集約 ---
// ログレベルの名前、優先度、コンソールメソッド名を一つのオブジェクトにまとめました。
// これにより、ログレベルに関する設定がこのオブジェクトを見るだけで完結し、直感的になります。
export const LogLevelSettings = {
    debug: { priority: 1, name: "debug" },
    info: { priority: 2, name: "info" },
    warn: { priority: 3, name: "warn" },
    error: { priority: 4, name: "error" },
} as const;

// --- 変更点(2): LogLevel型をより直感的に ---
// LogLevel型を、'debug' | 'info' | 'warn' | 'error' という具体的な文字列リテラル型に変更しました。
// これにより、型自体が設定可能な値を表すようになり、分かりやすくなります。
export type LogLevel = keyof typeof LogLevelSettings;

export type LogFn = (...args: any[]) => void;

interface LoggerInternalSettings {
    level?: LogLevel;
    name: string;
}

// 何もしない空関数
const noop = () => {};

/**
 * 動的なログレベル変更、プレフィックス表示、そして呼び出し元の行数特定を目的としたロガークラスです。
 *
 * このロガーの最大の特徴は、`console`メソッドの`bind`を組み合わせることで、
 * ログが呼び出されたファイル名と行番号をコンソールに正しく表示できる点にあります。
 * これにより、デバッグ効率が大幅に向上します。
 */
export class DirectLogger {
    private settings: LoggerInternalSettings;
    private prefix: string;
    private children: DirectLogger[] = [];

    // --- 変更点(3): 冗長なプロパティを廃止し、ゲッターに変更 ---
    // ログレベルの優先度を別途プロパティとして保持するのをやめ、
    // 現在のログレベルから動的に算出するゲッターにしました。
    // これにより、管理すべき状態が減り、コードがシンプルで堅牢になります。
    private get currentLevelPriority(): number {
        // settings.levelが未設定の場合でも'info'をデフォルトとして安全に動作します。
        const level = this.settings.level ?? "info";
        return LogLevelSettings[level].priority;
    }

    public debug: (...args: any[]) => void = noop;
    public info: (...args: any[]) => void = noop;
    public warn: (...args: any[]) => void = noop;
    public error: (...args: any[]) => void = noop;
    public log: (...args: any[]) => void = noop;

    constructor(settings: LoggerInternalSettings) {
        this.settings = settings;
        this.prefix = `[${settings.name}]`;

        // 初期レベルを 'info' のような文字列リテラルで設定
        this.settings.level = settings.level || "info";

        this.regenerateLogFunctions();
        console.info(
            `${this.prefix} Logger initialized with level: ${this.settings.level}`
        );
    }

    /**
     * 【新設】現在のログレベル設定に基づいて、全てのログ関数を再生成します。
     * このメソッドにロジックを集約することで、`constructor` と `updateLoggingState` で
     * 処理を共通化できます。
     * @private
     * @description
     * 【最重要】 `console[level].bind(console, this.prefix)` という実装がこのロガーの核です。
     * 1. **呼び出し元情報の保持**: `bind`されたコンソール関数を返すことで、実行が呼び出し元まで遅延されます。
     *    これにより、コンソールの出力にはこのロガークラスの内部ではなく、`Logger.debug(...)` が
     *    記述されたファイルと行番号が正しく表示されます。
     * 2. **プレフィックスの自動付与**: `bind`の第二引数にプレフィックスを渡すことで、ログ出力時に自動で先頭に付与します。
     * 3. **`this`コンテキストの維持**: `console`メソッドが正しい`this`（つまり`console`オブジェクト自身）で実行されることを保証します。
     */
    private regenerateLogFunctions(): void {
        const createLogFunction = (
            level: LogLevel
        ): ((...args: any[]) => void) => {
            // 優先度の比較を新しいゲッター経由で行います。
            if (LogLevelSettings[level].priority >= this.currentLevelPriority) {
                return console[level].bind(console, this.prefix);
            }
            return noop;
        };

        this.debug = createLogFunction("debug");
        this.info = createLogFunction("info");
        this.warn = createLogFunction("warn");
        this.error = createLogFunction("error");

        // `log` は `info` のエイリアスとして設定
        this.log = this.info;
    }

    /**
     * ロガーのログレベルを動的に更新し、設定変更をコンソールに通知します。
     * @param logLevel 新しく設定するログレベル
     */
    updateLoggingState(logLevel: LogLevel) {
        this.settings.level = logLevel;

        // 優先度プロパティの更新が不要になったため、コードがスッキリしました。
        this.regenerateLogFunctions();

        // Propagate the change to children
        for (const child of this.children) {
            child.updateLoggingState(logLevel);
        }

        console.info(
            `${this.prefix} Logging level set to: ${this.settings.level}`
        );
    }

    getLogLevel() {
        return this.settings.level || "info";
    }

    /**
     * 現在のロガーを親として、新しい子ロガー（サブロガー）を生成します。
     * プレフィックスは階層的に拡張され（例: `[AppName]` -> `[AppName:SubName]`）、
     * ログレベルの設定は親から引き継がれます。
     * @param options サブロガーのオプション
     * @param options.name サブロガーの名前。プレフィックスに追加されます。
     * @returns 新しいサブロガーのインスタンス
     */
    getSubLogger({ name }: { name: string }): DirectLogger {
        const basePrefix = this.prefix.slice(1, -1);
        const newPrefix = `${basePrefix}:${name}`;
        const subLogger = new DirectLogger({
            name: newPrefix,
            level: this.settings.level,
        });
        this.children.push(subLogger);
        return subLogger;
    }
}

export const INITIAL_LOG_LEVEL = getInitialLogLevel();

function getInitialLogLevel(): LogLevel {
    if (typeof process === "undefined") {
        // ブラウザ環境ではデフォルトをinfoに設定
        return "info";
    }
    const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL || process.env.LOG_LEVEL;
    // LogLevelSettingsのキーにenvLevelが含まれているかチェック
    const availableLevels = Object.keys(LogLevelSettings) as LogLevel[];
    if (envLevel && availableLevels.includes(envLevel as any)) {
        return envLevel as LogLevel;
    }
    return "info"; // デフォルトはinfo
}

export const Logger = new DirectLogger({
    name: "Nobi",
    level: INITIAL_LOG_LEVEL,
});
