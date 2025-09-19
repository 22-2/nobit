# CI/CD セットアップ完了 - 単体テスト対応

VitestとStorybookのCI/CDパイプラインを設定し、単体テストの自動実行機能を追加しました。

## 設定したワークフロー

### 1. CI Pipeline (`.github/workflows/ci.yml`)

- **トリガー**: main/developブランチへのpush、PR作成時
- **実行内容**:
    - 型チェック (`pnpm run check-types`)
    - フォーマットチェック (`pnpm run format:check`)
    - 単体テスト実行 (`pnpm run test:unit`)
    - Storybookテスト実行 (`pnpm run test:storybook`)
    - Storybookビルド (`pnpm run build-storybook`)
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
