# E2Eテストでシンボリックリンクを使用したプラグインインストール

## 概要

E2Eテスト実行時に、プラグインファイルをコピーする代わりにシンボリックリンクを作成することができます。
これにより、開発中にソースコードの変更がリアルタイムでテスト環境に反映されます。

## 使用方法

### 基本的な使い方

`TestPlugin`インターフェースに`useSymlink: true`オプションを追加します：

```typescript
import { test } from "../base";
import { DIST_DIR, PLUGIN_ID } from "../constants";

test.use({
	vaultOptions: {
		plugins: [
			{
				path: DIST_DIR,
				pluginId: PLUGIN_ID,
				useSymlink: true, // シンボリックリンクを使用
			},
		],
	},
});

test("your test", async ({ vault }) => {
	// テストコード
});
```

### BaseTestSetupを使用する場合

`DEFAULT_TEST_CONFIG`を拡張して使用します：

```typescript
import { BaseTestSetup, DEFAULT_TEST_CONFIG } from "../helpers/BaseTestSetup";
import { DIST_DIR, PLUGIN_ID } from "../constants";

test.use({
	vaultOptions: {
		...DEFAULT_TEST_CONFIG.vaultOptions,
		plugins: [
			{
				path: DIST_DIR,
				pluginId: PLUGIN_ID,
				useSymlink: true,
			},
		],
	},
});
```

## メリット

1. **リアルタイム反映**: `pnpm dev`でビルドした内容がすぐにテスト環境に反映される
2. **高速**: ファイルコピーが不要なため、テスト起動が高速
3. **開発体験の向上**: ビルドとテストのサイクルが短縮される

## 注意事項

### Windows環境での権限

Windowsでシンボリックリンクを作成するには、管理者権限または開発者モードの有効化が必要です。

**開発者モードを有効にする方法:**

1. 設定 → 更新とセキュリティ → 開発者向け
2. 「開発者モード」をオンにする

権限がない場合、以下のエラーが発生します：

```
Permission denied. You may need administrator privileges to create symlinks on Windows.
```

### デフォルトの動作

`useSymlink`が指定されていない場合（`undefined`または`false`）は、従来通りファイルコピーが実行されます。

## トラブルシューティング

### シンボリックリンクが作成されない

- Windowsの場合: 開発者モードが有効になっているか確認
- パスが正しいか確認: `DIST_DIR`が存在し、`manifest.json`が含まれているか確認
- ログを確認: `PluginManager`のログに詳細なエラーメッセージが出力されます

### テストが失敗する

シンボリックリンクを使用する場合は、事前に`pnpm build`または`pnpm dev`を実行して、
`dist`ディレクトリが存在し、必要なファイル（`main.js`, `manifest.json`, `styles.css`）が
含まれていることを確認してください。

## 実装の詳細

- `e2e/helpers/types.ts`: `TestPlugin`インターフェースの定義
- `e2e/helpers/managers/PluginManager.ts`: インストールロジックの実装
