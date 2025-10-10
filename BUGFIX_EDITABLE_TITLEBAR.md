# EditableTitleBar URL入力機能の修正

## 問題

EditableTitleBarにURLを入力してEnterキーを押しても、スレッドに遷移しない問題がありました。

## 原因

`ThreadView.navigateToThreadFromUrl()`メソッドが`setState()`を呼ぶだけで、実際にスレッドを読み込む処理（`threadManager.loadThread()`）をトリガーしていませんでした。

### 問題のあったコード

```typescript
async navigateToThreadFromUrl(url: string): Promise<void> {
    logger.debug("Navigating to thread from URL:", url);
    const state = this.state || {};
    await this.setState({ url, ...state } as ThreadViewState, { history: false });
    // スレッドの読み込みがトリガーされない！
}
```

`setState()`は内部で`render()`を呼びますが、これは新しいSvelteコンポーネントをマウントするだけです。`ThreadViewComponent`は`onMount`で`initialUrl`を使ってスレッドを読み込みますが、既にマウント済みの場合は再読み込みされません。

## 修正内容

`navigateToThreadFromUrl()`メソッドで、`setState()`の後に直接`threadManager.loadThread()`を呼ぶように修正しました。

### 修正後のコード

```typescript
async navigateToThreadFromUrl(url: string): Promise<void> {
    logger.debug("Navigating to thread from URL:", url);
    const state = this.state || {};
    await this.setState({ url, ...state } as ThreadViewState, { history: false });
    // 直接スレッドを読み込む
    await this.threadManager.loadThread(url);
}
```

## テスト

新しいe2eテスト `e2e/specs/editable-titlebar.spec.ts` を追加して、以下をテストしています：

1. **URL入力による遷移**: タイトルバーにURLを入力してEnterキーを押すと、新しいスレッドに遷移する
2. **Blurでの復元**: Enterキーを押さずにフォーカスを外すと、元のタイトルに戻る

### テスト結果

```
✓ should navigate to thread when URL is entered in title bar
✓ should restore display text on blur without Enter
```

既存のテストも全て通過しています：

```
✓ Thread View Integration Tests (5 tests)
```

## 影響範囲

- `src/view/ThreadView.ts`: `navigateToThreadFromUrl()`メソッドの修正
- `e2e/specs/editable-titlebar.spec.ts`: 新規テストファイル追加

既存の機能には影響ありません。
