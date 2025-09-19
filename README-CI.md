# CI/CD セットアップ完了 - フルテスト対応

Vitest、Storybook、PlaywrightのCI/CDパイプラインを設定し、単体テスト・インタラクションテスト・E2Eテストの自動実行機能を追加しました。

## 設定したワークフロー

### 1. CI Pipeline (`.github/workflows/ci.yml`)

- **トリガー**: main/developブランチへのpush、PR作成時
- **実行内容**:
    - 型チェック (`pnpm run check-types`)
    - フォーマットチェック (`pnpm run format:check`)
    - 単体テスト実行 (`pnpm run test:unit`)
    - Storybookテスト実行 (`pnpm run test:storybook`)
    - Storybookビルド (`pnpm run build-storybook`)
    - E2Eテスト実行 (`pnpm run test:e2e`)
    - カバレッジレポートの生成（ローカル保存のみ）

### 2. テスト実行 (`.github/workflows/test-watch.yml`)

- **トリガー**: 手動実行
- **実行内容**:
    - 単体テスト、Storybookテスト、または両方を選択して実行

## テスト構成

### 単体テスト

- **環境**: jsdom (Node.js環境でDOM操作をシミュレート)
- **対象**: `src/**/*.{test,spec}.{js,ts,svelte}`
- **除外**: Storybookファイル (`*.stories.*`)
- **セットアップ**: `vitest.setup.ts` でDOM APIのモック

### Storybookテスト

- **環境**: Playwright (実際のブラウザ環境)
- **対象**: Storybookで定義されたストーリー
- **セットアップ**: `.storybook/vitest.setup.ts`

### E2Eテスト

- **環境**: Playwright (複数ブラウザ対応)
- **対象**: 既存コンポーネントの実際のユーザーインタラクション
- **テスト対象**:
    - Popoverコンポーネント（ホバー、クリック、タイマー機能）
    - ThreadTableRowコンポーネント（行選択、ソート、レスポンシブ）
    - LoadingSpinnerコンポーネント（アニメーション、アクセシビリティ）
    - BoardTreeコンポーネント（ツリー展開、キーボードナビゲーション）

## 利用可能なコマンド

```bash
# 全テスト実行
pnpm run test

# 単体テストのみ実行
pnpm run test:unit

# 単体テストをwatch モードで実行
pnpm run test:unit:watch

# Storybookテストのみ実行
pnpm run test:storybook

# E2Eテストのみ実行
pnpm run test:e2e

# E2EテストをUIモードで実行（デバッグ用）
pnpm run test:e2e:ui

# E2Eテストをヘッドありモードで実行（ブラウザ表示）
pnpm run test:e2e:headed

# カバレッジレポート付きでテスト実行
pnpm run test:coverage

# Storybookビルド
pnpm run build-storybook
```

## 追加したファイル

### テスト設定

- `packages/ui/vitest.setup.ts` - 単体テスト用セットアップ
- `packages/ui/.vscode/settings.json` - VS Code Vitest拡張の設定

### サンプルテスト

- `packages/ui/src/utils/math.test.ts` - 単体テストのサンプル
- `packages/ui/src/utils/math.ts` - テスト対象のユーティリティ関数

## VS Code 拡張機能

以下の拡張機能をインストールすることで、エディタ内でテストを実行できます：

- **Vitest** (`vitest.explorer`) - テストの実行と結果表示
- **Test Explorer UI** - テスト結果の統合表示

## 開発フォーカス設定

このCI/CD設定は開発とテストに特化しており、以下の機能は無効化されています：

- GitHub Pagesへの自動デプロイ
- Chromaticビジュアルテスト
- 外部サービスへのカバレッジアップロード

必要に応じて後から有効化できます。

これで単体テストが自動実行され、ローカル開発に集中できます！

## E2Eテストの特徴

### 既存コンポーネントのテスト

- **Popoverコンポーネント**: レス番号リンクのホバー表示、返信ツリー、非表示タイマー
- **ThreadTableRowコンポーネント**: スレッド行の選択、ホバー効果、コンテキストメニュー
- **LoadingSpinnerコンポーネント**: アニメーション動作、サイズバリエーション、アクセシビリティ
- **BoardTreeコンポーネント**: ツリー展開/折りたたみ、キーボードナビゲーション

### ブラウザ対応

- **デスクトップ**: Chrome、Firefox、Safari
- **モバイル**: Mobile Chrome、Mobile Safari
- **レスポンシブテスト**: 各種画面サイズでの動作確認

### アクセシビリティテスト

- ARIA属性の確認
- キーボードナビゲーション
- スクリーンリーダー対応
- フォーカストラップ

### パフォーマンステスト

- アニメーション性能
- 大量データでの動作
- レイアウトシフトの検出
- ネットワーク要求の監視

## テストヘルパー機能

### インタラクションヘルパー (`src/test-utils/interaction-helpers.ts`)

- アニメーション完了待機
- フォーカストラップテスト
- キーボードナビゲーションテスト
- レスポンシブ動作テスト
- フォーム送信テスト
- ドラッグ&ドロップテスト

### E2Eヘルパー (`tests/e2e/helpers/test-helpers.ts`)

- Storybookナビゲーション
- CSS変数取得
- パフォーマンス測定
- ネットワーク監視
- コンソールエラー監視
- ローカル/セッションストレージ操作

## デバッグ機能

### UIモード

```bash
pnpm run test:e2e:ui
```

- テストの実行状況を視覚的に確認
- ステップバイステップでのデバッグ
- スクリーンショット・動画の確認

### ヘッドありモード

```bash
pnpm run test:e2e:headed
```

- ブラウザを表示してテスト実行
- 実際の動作を目視確認
- デバッグ時の動作確認

これで既存のSvelteコンポーネントに対する包括的なテスト環境が完成しました！
