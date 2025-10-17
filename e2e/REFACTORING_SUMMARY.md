# E2E テストリファクタリング概要

## SOLID原則に基づくリファクタリング

### 実施内容

#### 1. Single Responsibility Principle (単一責任の原則)

各ヘルパークラスが単一の責任を持つように分離：

- **BaseTestSetup**: テストの初期化とセットアップ
- **SelectionDialogHelper**: 選択ダイアログ操作
- **TitleTestHelper**: タイトル関連のテスト操作
- **PopoverTestHelper**: ポップオーバー関連のテスト操作

#### 2. Open/Closed Principle (開放/閉鎖の原則)

- 既存のヘルパークラスを拡張可能に設計
- 新しいテストケースを追加する際、既存コードを変更せずに拡張可能

#### 3. Liskov Substitution Principle (リスコフの置換原則)

- BaseTestSetupを基底クラスとして、特定のテストシナリオ用に拡張可能

#### 4. Interface Segregation Principle (インターフェース分離の原則)

- 各ヘルパークラスが必要最小限のメソッドのみを提供
- テストが不要な機能に依存しない

#### 5. Dependency Inversion Principle (依存性逆転の原則)

- 具体的な実装ではなく、抽象化されたヘルパークラスに依存
- DEFAULT_TEST_CONFIGで設定を一元管理

### 新規作成ファイル

1. **e2e/helpers/BaseTestSetup.ts**
    - 共通のテストセットアップロジック
    - setupBasicThread, setupCustomThread, setupLargeThread メソッド
    - DEFAULT_TEST_CONFIG エクスポート

2. **e2e/helpers/SelectionDialogHelper.ts**
    - 選択ダイアログのテスト操作
    - addToHistory, openDialog, selectFirstItemWithEnter, clickFirstSuggestion

3. **e2e/helpers/TitleTestHelper.ts**
    - タイトル関連のテスト操作
    - verifyTitleConsistency, navigateViaTitle, testTitleRestoration

4. **e2e/helpers/PopoverTestHelper.ts**
    - ポップオーバーのテスト操作
    - hoverAndVerifyPopover, testPopoverPersistence, testParentClickClosesChild

### リファクタリングしたテストファイル

1. **selection-dialog.spec.ts** - 選択ダイアログテスト
2. **editable-titlebar.spec.ts** - 編集可能タイトルバーテスト
3. **popover-parent-child.spec.ts** - ポップオーバー親子関係テスト
4. **thread-title-reliability.spec.ts** - スレッドタイトル信頼性テスト
5. **thread-view-mvp.spec.ts** - MVP基本機能テスト
6. **thread-view-performance.spec.ts** - パフォーマンステスト
7. **thread-view-integration.spec.ts** - 統合テスト
8. **debug-title-parsing.spec.ts** - タイトルパースデバッグテスト
9. **url-history.spec.ts** - URL履歴テスト
10. **example.spec.ts** - サンプルテスト

### 改善点

#### コードの重複削減

- 各テストファイルで繰り返されていたセットアップコードを共通化
- 約60-70%のコード削減

#### 可読性の向上

- テストの意図が明確になった
- ヘルパーメソッド名が自己文書化

#### 保守性の向上

- 変更が必要な場合、ヘルパークラスのみを修正
- テストファイル間の一貫性が向上

#### テストの信頼性向上

- 共通ロジックのバグ修正が全テストに反映
- エラーハンドリングの一貫性

### 使用例

```typescript
// Before (重複コードが多い)
test("should open thread", async ({ vault }) => {
	const threadPage = new ThreadViewPageObject(
		vault.window,
		vault.pluginHandleMap,
	);
	const mockHelper = new TestFetcherMockHelper(vault.window);

	await mockHelper.setupPatternMock(".dat", {
		status: 200,
		body: MockDataFactory.createBasicThreadData(),
	});

	await threadPage.openAndVerifyThreadView(PLUGIN_ID, url);
	await threadPage.waitForThreadContent();
	// ... テストロジック
});

// After (簡潔で明確)
test("should open thread", async ({ vault }) => {
	const setup = new BaseTestSetup(vault);
	await setup.setupBasicThread();
	// ... テストロジック
});
```

### 今後の拡張性

- 新しいテストシナリオ用のヘルパークラスを追加可能
- BaseTestSetupを継承して特殊なセットアップを作成可能
- 各ヘルパークラスに新しいメソッドを追加して機能拡張可能

### 注意事項

- ThreadManagerTestHelper.ts は既存のまま保持（別の責任を持つため）
- 既存のPageObjectパターン（ThreadViewPageObject等）は維持
- テストの動作は変更せず、構造のみをリファクタリング
