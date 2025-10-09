# E2Eテストのリファクタリング - SOLID原則適用

## 概要

このドキュメントでは、E2Eテストファイルに対してSOLID原則を適用したリファクタリングについて説明します。

## 適用したSOLID原則

### 1. Single Responsibility Principle (単一責任の原則)

**問題点**: 各テストファイルが複数の責務を持っていた
- テストロジック
- モックデータ生成
- ネットワークモック設定
- パフォーマンス測定
- UI操作

**解決策**: 責務ごとにヘルパークラスを分離

```typescript
// パフォーマンス測定専用
PerformanceTestHelper

// ThreadView操作専用
ThreadViewTestHelper

// ネットワークモック専用
NetworkMockHelper

// モックデータ生成専用
MockDataFactory

// フィクスチャ管理専用
FixtureHelper
```

### 2. Open/Closed Principle (開放閉鎖の原則)

**問題点**: 新しいモックデータタイプを追加する際、既存コードを変更する必要があった

**解決策**: `MockDataFactory`を使用してファクトリーパターンを実装

```typescript
export class MockDataFactory {
  static createBasicThreadData(): string { ... }
  static createLargeThreadData(postCount: number): string { ... }
  static createEmptyThreadData(): string { ... }
  static createErrorResponse(status = 500): MockResponse { ... }
  static createSuccessResponse(body: string): MockResponse { ... }
}
```

新しいモックタイプを追加する場合、既存のメソッドを変更せずに新しいメソッドを追加するだけで対応可能。

### 3. Liskov Substitution Principle (リスコフの置換原則)

**適用**: ヘルパークラスは一貫したインターフェースを提供

```typescript
// すべてのヘルパーは同じパターンで使用可能
const helper = new ThreadViewTestHelper(page, obsPage);
await helper.openAndVerifyThreadView(pluginId, url);
await helper.waitForThreadContent();
```

### 4. Interface Segregation Principle (インターフェース分離の原則)

**問題点**: 大きなテストユーティリティクラスに多くのメソッドが詰め込まれていた

**解決策**: 目的別に小さなヘルパークラスに分割

```typescript
// パフォーマンステストのみが必要な場合
const perfHelper = new PerformanceTestHelper(page);

// ThreadView操作のみが必要な場合
const threadHelper = new ThreadViewTestHelper(page, obsPage);

// ネットワークモックのみが必要な場合
const networkHelper = new NetworkMockHelper(page);
```

### 5. Dependency Inversion Principle (依存性逆転の原則)

**問題点**: テストが具体的な実装に強く依存していた

**解決策**: 抽象化されたヘルパーインターフェースに依存

```typescript
// Before: 具体的な実装に依存
await vault.window.evaluate(() => {
  const activeLeaf = app.workspace.activeLeaf;
  if (activeLeaf && activeLeaf.view.getViewType() === "thread-view") {
    const threadView = activeLeaf.view as any;
    return threadView.threadManager.thread;
  }
});

// After: 抽象化されたヘルパーに依存
const state = await threadHelper.getThreadManagerState();
```

## ヘルパークラスの構造

### PerformanceTestHelper
- `measureExecutionTime()`: 処理時間測定
- `getMemoryUsage()`: メモリ使用量取得
- `measureScrollPerformance()`: スクロールパフォーマンス測定
- `checkMemoryLeak()`: メモリリークチェック

### ThreadViewTestHelper
- `openAndVerifyThreadView()`: ThreadViewを開いて検証
- `waitForThreadContent()`: コンテンツ読み込み待機
- `verifyBasicUIStructure()`: UI構造検証
- `getPostCount()`: 投稿数取得
- `getThreadManagerState()`: ThreadManager状態取得
- `clickRefreshButton()`: リフレッシュボタンクリック
- `verifyErrorState()`: エラー状態検証
- `verifyLoadingState()`: ローディング状態検証
- `closeThreadView()`: ThreadView閉じる
- `applySearchFilter()`: 検索フィルター適用
- `clearSearchFilter()`: 検索フィルタークリア

### NetworkMockHelper
- `setupBasicRoute()`: 基本的なルートモック設定
- `setupConditionalRoute()`: 条件付きルートモック設定
- `resetRequestCount()`: リクエストカウントリセット
- `getRequestStats()`: リクエスト統計取得
- `clearRoutes()`: ルートクリア

### MockDataFactory
- `createBasicThreadData()`: 基本スレッドデータ生成
- `createLargeThreadData()`: 大規模スレッドデータ生成
- `createEmptyThreadData()`: 空スレッドデータ生成
- `createErrorResponse()`: エラーレスポンス生成
- `createSuccessResponse()`: 成功レスポンス生成

### FixtureHelper
- `getFixturePath()`: フィクスチャパス取得
- `loadFixture()`: フィクスチャ読み込み
- `setupFixtureRoute()`: フィクスチャルート設定

## リファクタリング後のテストファイル

### 新しいファイル構造

```
e2e/
├── helpers/
│   ├── PerformanceTestHelper.ts       (新規)
│   ├── ThreadViewTestHelper.ts        (新規)
│   ├── NetworkMockHelper.ts           (新規)
│   ├── MockDataFactory.ts             (新規)
│   ├── FixtureHelper.ts               (新規)
│   └── ObsidianPageObject.ts          (既存)
└── specs/
    ├── thread-view-performance.refactored.spec.ts    (リファクタリング済み)
    ├── thread-view-integration.refactored.spec.ts    (リファクタリング済み)
    ├── thread-view-mvp.refactored.spec.ts            (リファクタリング済み)
    ├── thread-view-performance.spec.ts               (元のファイル)
    ├── thread-view-integration-validation.spec.ts    (元のファイル)
    └── thread-view-mvp.spec.ts                       (元のファイル)
```

## 使用例

### Before (リファクタリング前)

```typescript
test("Performance test", async ({ vault }) => {
  // Setup
  const vaultName = await vault.window.evaluate(() => app.vault.getName());
  expect(vaultName).toBe(SANDBOX_VAULT_NAME);

  // Mock setup
  const mockData = generateLargeThreadData(500);
  await vault.window.route('**/liveedge/1759320900/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'text/html; charset=Shift_JIS',
      body: mockData
    });
  });

  // Measure time
  const startTime = Date.now();
  await obsPage.openPluginWithURL(PLUGIN_ID, url);
  await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);
  await expect(vault.window.locator('.thread-content')).toBeVisible({ timeout: 15000 });
  const loadTime = Date.now() - startTime;

  // Verify
  const postCount = await vault.window.locator('.posts-container .post').count();
  expect(postCount).toBeGreaterThan(0);
  expect(loadTime).toBeLessThan(10000);
});
```

### After (リファクタリング後)

```typescript
test("Performance test", async ({ vault }) => {
  const obsPage = new ObsidianPageObject(vault.window, vault.pluginHandleMap);
  const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
  const networkHelper = new NetworkMockHelper(vault.window);
  const perfHelper = new PerformanceTestHelper(vault.window);

  // Setup mock
  const mockData = MockDataFactory.createLargeThreadData(500);
  await networkHelper.setupBasicRoute(
    "**/liveedge/1759320900/**",
    MockDataFactory.createSuccessResponse(mockData)
  );

  // Measure load time
  const loadTime = await perfHelper.measureExecutionTime(async () => {
    await threadHelper.openAndVerifyThreadView(PLUGIN_ID, url);
    await threadHelper.waitForThreadContent();
  });

  // Verify
  const postCount = await threadHelper.getPostCount();
  expect(postCount).toBeGreaterThan(0);
  expect(loadTime).toBeLessThan(10000);
});
```

## メリット

### 1. 可読性の向上
- テストの意図が明確
- ボイラープレートコードの削減
- ビジネスロジックに集中できる

### 2. 保守性の向上
- 変更の影響範囲が限定的
- 共通ロジックの一元管理
- バグ修正が容易

### 3. 再利用性の向上
- ヘルパークラスを他のテストでも使用可能
- 新しいテストの作成が容易
- コードの重複を削減

### 4. テスト性の向上
- ヘルパークラス自体もテスト可能
- モックの管理が容易
- デバッグが簡単

## 移行ガイド

### 既存テストの移行手順

1. **ヘルパークラスのインスタンス化**
```typescript
const threadHelper = new ThreadViewTestHelper(vault.window, obsPage);
const perfHelper = new PerformanceTestHelper(vault.window);
```

2. **モックデータの置き換え**
```typescript
// Before
const mockData = `1<>名無しさん@転載は禁止<>...`;

// After
const mockData = MockDataFactory.createBasicThreadData();
```

3. **ネットワークモックの置き換え**
```typescript
// Before
await vault.window.route('**/test/read.cgi/**', route => {
  route.fulfill({ status: 200, body: mockData });
});

// After
await networkHelper.setupBasicRoute(
  "**/test/read.cgi/**",
  MockDataFactory.createSuccessResponse(mockData)
);
```

4. **UI操作の置き換え**
```typescript
// Before
await obsPage.openPluginWithURL(PLUGIN_ID, url);
await obsPage.expectViewCount(VIEW_TYPE_THREAD, 1);
await expect(vault.window.locator('.thread-content')).toBeVisible();

// After
await threadHelper.openAndVerifyThreadView(PLUGIN_ID, url);
await threadHelper.waitForThreadContent();
```

## 今後の拡張

### 新しいヘルパークラスの追加

必要に応じて以下のようなヘルパークラスを追加できます：

- `FilterTestHelper`: フィルター操作専用
- `PostItemTestHelper`: PostItem操作専用
- `ToolbarTestHelper`: ツールバー操作専用
- `ValidationHelper`: 検証ロジック専用

### ベストプラクティス

1. **1つのヘルパークラスは1つの責務のみ**
2. **メソッド名は明確で説明的に**
3. **エラーハンドリングを適切に実装**
4. **型安全性を確保**
5. **ドキュメントコメントを追加**

## まとめ

SOLID原則を適用することで、E2Eテストコードの品質が大幅に向上しました。テストの可読性、保守性、再利用性が改善され、新しいテストの追加や既存テストの変更が容易になりました。
