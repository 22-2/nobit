<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import WheelProgressIndicator from '../components/WheelProgressIndicator.svelte';

  // defineMeta で Storybook のメタ情報を定義します
  const { Story } = defineMeta({
    // Storybook のサイドバーに表示されるタイトル
    title: 'UI/WheelProgressIndicator',
    // 対象のコンポーネント
    component: WheelProgressIndicator,
    // Storybook の Docs ページを自動生成するタグ
    tags: ['autodocs'],
    // Storybook の Controls パネルで操作できる引数を定義
    argTypes: {
      position: {
        control: { type: 'select' },
        options: ['top', 'bottom'],
        description: 'インジケーターの表示位置',
      },
      isCoolingDown: {
        control: 'boolean',
        description: 'クールダウン中か (true の場合非表示)',
      },
      isRefreshing: {
        control: 'boolean',
        description: 'リフレッシュ中か (true の場合非表示)',
      },
      progress: {
        control: 'object',
        description: '進捗状況を管理するオブジェクト',
      }
    },
    // デコレーターを使って、コンポーネントを中央に配置し、
    // 絶対配置のコンテキストを提供します
    // decorators: [
    //   (Story) => ({
    //     // template を使うことで、Story をラップするHTMLを定義できます
    //     template: `
    //       <div style="
    //         position: relative;
    //         height: 200px;
    //         border: 1px dashed #ccc;
    //         display: flex;
    //         align-items: center;
    //         justify-content: center;
    //         padding: 1rem;
    //       ">
    //         <Story />
    //       </div>
    //     `
    //   })
    // ]
  });
</script>

<!--
  各 Story コンポーネントに name と args を渡すことで、
  様々なバリエーションのストーリーを作成できます。
-->

<!-- 1. デフォルトの状態（下方向へのスクロール途中） -->
<Story
  name="Default"
  args={{
    progress: { count: 4, threshold: 7, direction: 'down' },
    position: 'top',
    isCoolingDown: false,
    isRefreshing: false,
  }}
/>

<!-- 2. プログレスが100%に達した状態 -->
<Story
  name="Progress Full"
  args={{
    progress: { count: 7, threshold: 7, direction: 'down' },
    position: 'top',
  }}
/>

<!-- 3. 上方向へのスクロールを示している状態 -->
<Story
  name="Direction Up"
  args={{
    // 'Default'ストーリーのargsを上書き
    ...{
      progress: { count: 3, threshold: 7, direction: 'up' },
    }
  }}
/>

<!-- 4. インジケーターが下部に表示される状態 -->
<Story
  name="Position Bottom"
  args={{
    progress: { count: 5, threshold: 7, direction: 'down' },
    position: 'bottom',
  }}
/>

<!-- 5. isCoolingDown が true で非表示になる状態 -->
<Story
  name="Hidden (Cooling Down)"
  args={{
    progress: { count: 4, threshold: 7, direction: 'down' },
    position: 'top',
    isCoolingDown: true, // このフラグによりコンポーネントは描画されません
  }}
/>
