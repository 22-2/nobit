<script module>
import { defineMeta } from "@storybook/addon-svelte-csf";
import ThreadToolbar from "../../view/thread/ThreadToolbar.svelte";
import CenterDecorator from "../helpers/CenterDecorator.svelte";
import { fn } from "storybook/test";

// Mock ThreadManager for integration testing
const createMockThreadManager = (overrides = {}) => ({
	thread: null,
	isLoading: false,
	error: null,
	filters: {
		popular: false,
		image: false,
		video: false,
		external: false,
		internal: false,
		searchText: "",
	},
	refreshThread: fn(),
	updateFilters: fn(),
	jumpToPost: fn(),
	loadThread: fn(),
	...overrides,
});

const { Story } = defineMeta({
	title: "Thread/ThreadToolbar",
	component: ThreadToolbar,
	tags: ["autodocs"],
	argTypes: {
		isCoolingDown: {
			control: "boolean",
			description: "リフレッシュボタンのクールダウン状態",
		},
		isLoading: {
			control: "boolean",
			description: "ローディング状態（ThreadManagerから取得）",
		},
		onRefresh: {
			action: "onRefresh",
			description: "リフレッシュボタンクリック時のコールバック",
		},
		onWriteButtonClick: {
			action: "onWriteButtonClick",
			description: "書き込みボタンクリック時のコールバック",
		},
	},
	decorators: [
		(StoryComponent) => ({
			Component: CenterDecorator,
			props: {
				children: StoryComponent,
				padding: "var(--size-4-4)",
				minHeight: "var(--size-4-15)",
			},
		}),
	],
});
</script>

<!-- デフォルトの状態 -->
<Story
    name="Default"
    args={{
        isCoolingDown: false,
        isLoading: false,
        onRefresh: fn(),
        onWriteButtonClick: fn(),
    }}
/>

<!-- ローディング状態 -->
<Story
    name="Loading State"
    args={{
        isCoolingDown: false,
        isLoading: true,
        onRefresh: fn(),
        onWriteButtonClick: fn(),
    }}
/>

<!-- クールダウン状態 -->
<Story
    name="Cooldown State"
    args={{
        isCoolingDown: true,
        isLoading: false,
        onRefresh: fn(),
        onWriteButtonClick: fn(),
    }}
/>

<!-- ローディング＋クールダウン状態 -->
<Story
    name="Loading and Cooldown"
    args={{
        isCoolingDown: true,
        isLoading: true,
        onRefresh: fn(),
        onWriteButtonClick: fn(),
    }}
/>

<!-- リフレッシュボタンのみ -->
<Story
    name="Refresh Only"
    args={{
        isCoolingDown: false,
        isLoading: false,
        onRefresh: fn(),
        onWriteButtonClick: undefined,
    }}
/>

<!-- 書き込みボタンのみ -->
<Story
    name="Write Only"
    args={{
        isCoolingDown: false,
        isLoading: false,
        onRefresh: undefined,
        onWriteButtonClick: fn(),
    }}
/>

<!-- ThreadManager統合テスト -->
<Story
    name="ThreadManager Integration"
    args={{
        isCoolingDown: false,
        isLoading: false,
        onRefresh: fn(),
        onWriteButtonClick: fn(),
    }}
>
    <CenterDecorator padding="var(--size-4-4)" minHeight="var(--size-4-25)">
        <div style="width: 100%; max-width: 600px;">
            <h3 style="margin-bottom: var(--size-4-4); color: var(--text-normal);">
                ThreadManager統合テスト
            </h3>
            <p style="margin-bottom: var(--size-4-4); color: var(--text-muted); font-size: 0.9em;">
                ThreadManagerのモックと連携したツールバーの動作テスト
            </p>
            
            <!-- 通常状態 -->
            <div style="margin-bottom: var(--size-4-4);">
                <h4 style="color: var(--text-normal); margin-bottom: var(--size-4-2); font-size: 0.9em;">
                    通常状態（ThreadManager: thread=null, isLoading=false）
                </h4>
                <ThreadToolbar
                    isCoolingDown={false}
                    isLoading={createMockThreadManager().isLoading}
                    onRefresh={() => {
                        const mockManager = createMockThreadManager();
                        mockManager.refreshThread();
                        console.log("Refresh clicked - ThreadManager.refreshThread() called");
                    }}
                    onWriteButtonClick={fn()}
                />
            </div>

            <!-- ローディング状態 -->
            <div style="margin-bottom: var(--size-4-4);">
                <h4 style="color: var(--text-normal); margin-bottom: var(--size-4-2); font-size: 0.9em;">
                    ローディング状態（ThreadManager: isLoading=true）
                </h4>
                <ThreadToolbar
                    isCoolingDown={false}
                    isLoading={createMockThreadManager({ isLoading: true }).isLoading}
                    onRefresh={() => {
                        console.log("Refresh disabled during loading");
                    }}
                    onWriteButtonClick={fn()}
                />
            </div>

            <!-- スレッド読み込み済み状態 -->
            <div style="margin-bottom: var(--size-4-4);">
                <h4 style="color: var(--text-normal); margin-bottom: var(--size-4-2); font-size: 0.9em;">
                    スレッド読み込み済み状態
                </h4>
                <ThreadToolbar
                    isCoolingDown={false}
                    isLoading={false}
                    onRefresh={() => {
                        const mockManager = createMockThreadManager({
                            thread: {
                                id: "1234567890",
                                title: "テストスレッド",
                                url: "https://example.5ch.net/test/read.cgi/board/1234567890/",
                                posts: []
                            }
                        });
                        mockManager.refreshThread();
                        console.log("Refresh clicked - Reloading current thread");
                    }}
                    onWriteButtonClick={fn()}
                />
            </div>

            <div style="margin-top: var(--size-4-4); padding: var(--size-4-3); background-color: var(--background-secondary); border-radius: var(--radius-s);">
                <p style="color: var(--text-muted); font-size: 0.85em; margin: 0;">
                    注意: この統合テストでは、ThreadManagerのモックを使用してツールバーの動作を検証します。
                    実際のThreadManagerとの統合は、E2Eテストで確認してください。
                </p>
            </div>
        </div>
    </CenterDecorator>
</Story>

<!-- エラー状態での動作テスト -->
<Story
    name="Error State Integration"
    args={{
        isCoolingDown: false,
        isLoading: false,
        onRefresh: fn(),
        onWriteButtonClick: fn(),
    }}
>
    <CenterDecorator padding="var(--size-4-4)" minHeight="var(--size-4-20)">
        <div style="width: 100%; max-width: 600px;">
            <h3 style="margin-bottom: var(--size-4-4); color: var(--text-normal);">
                エラー状態での統合テスト
            </h3>
            
            <div style="margin-bottom: var(--size-4-4);">
                <h4 style="color: var(--text-normal); margin-bottom: var(--size-4-2); font-size: 0.9em;">
                    エラー状態（ThreadManager: error="ネットワークエラー"）
                </h4>
                <ThreadToolbar
                    isCoolingDown={false}
                    isLoading={false}
                    onRefresh={() => {
                        const mockManager = createMockThreadManager({
                            error: "スレッドの読み込みに失敗しました: Network error"
                        });
                        mockManager.refreshThread();
                        console.log("Retry refresh after error");
                    }}
                    onWriteButtonClick={() => {
                        console.log("Write button clicked despite error state");
                    }}
                />
            </div>

            <div style="padding: var(--size-4-3); background-color: var(--background-modifier-error); border-radius: var(--radius-s);">
                <p style="color: var(--text-error); font-size: 0.85em; margin: 0;">
                    模擬エラー: スレッドの読み込みに失敗しました: Network error
                </p>
            </div>
        </div>
    </CenterDecorator>
</Story>

<!-- レスポンシブテスト -->
<Story
    name="Responsive Test"
    args={{
        isCoolingDown: false,
        isLoading: false,
        onRefresh: fn(),
        onWriteButtonClick: fn(),
    }}
>
    <div style="display: flex; flex-direction: column; gap: var(--size-4-4); padding: var(--size-4-4);">
        <div>
            <h4 style="color: var(--text-normal); margin-bottom: var(--size-4-2);">
                デスクトップ幅（600px）
            </h4>
            <div style="width: 600px; border: 1px solid var(--background-modifier-border);">
                <ThreadToolbar
                    isCoolingDown={false}
                    isLoading={false}
                    onRefresh={fn()}
                    onWriteButtonClick={fn()}
                />
            </div>
        </div>

        <div>
            <h4 style="color: var(--text-normal); margin-bottom: var(--size-4-2);">
                タブレット幅（400px）
            </h4>
            <div style="width: 400px; border: 1px solid var(--background-modifier-border);">
                <ThreadToolbar
                    isCoolingDown={false}
                    isLoading={false}
                    onRefresh={fn()}
                    onWriteButtonClick={fn()}
                />
            </div>
        </div>

        <div>
            <h4 style="color: var(--text-normal); margin-bottom: var(--size-4-2);">
                モバイル幅（300px）
            </h4>
            <div style="width: 300px; border: 1px solid var(--background-modifier-border);">
                <ThreadToolbar
                    isCoolingDown={false}
                    isLoading={false}
                    onRefresh={fn()}
                    onWriteButtonClick={fn()}
                />
            </div>
        </div>
    </div>
</Story>