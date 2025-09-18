import type {
  BBSMenu,
  Post,
  PostData,
  PostResult,
  SubjectItem,
  OldThread,
} from "./types";

/**
 * 異なる種類のBBS（掲示板システム）の操作を抽象化するためのインターフェース。
 * 新しいBBSに対応するには、このインターフェースを実装したクラスを作成し、
 * プラグインとして登録します。
 */
export interface BBSProvider {
  /**
   * プロバイダーの一意なID (例: "5ch-compat", "talk-jp")
   */
  readonly id: string;

  /**
   * UIに表示されるプロバイダーの名前 (例: "5ch互換BBS", "Talk掲示板")
   */
  readonly name: string;

  /**
   * 指定されたURLをこのプロバイダーが処理できるかどうかを判定します。
   * @param url - 判定対象のURL（板 or スレッド）
   * @returns このプロバイダーが処理できる場合はtrue
   */
  canHandleUrl(url: string): boolean;

  /**
   * 板のURLからスレッド一覧を取得します。
   * @param boardUrl - スレッド一覧を取得する板のURL
   * @returns スレッドのリストを含むオブジェクト
   */
  getThreads(boardUrl: string): Promise<SubjectItem[]>;

  /**
   * 板のURLから板のタイトルを取得します。
   * @param boardUrl - 板のURL
   * @returns 板のタイトル
   */
  getBoardTitle(boardUrl: string): Promise<string>;

  /**
   * スレッドのURLから投稿一覧を取得します。
   * @param threadUrl - 投稿一覧を取得するスレッドのURL
   * @returns 投稿のリストを含むオブジェクト
   */
  getThread(threadUrl: string): Promise<OldThread>;

  /**
   * 指定されたスレッドに新しい投稿を書き込みます。
   * @param threadUrl - 書き込み対象のスレッドのURL
   * @param postData - 書き込むデータ
   * @param headers - 追加のHTTPヘッダー
   * @returns 書き込み結果
   */
  post(
    threadUrl: string,
    postData: PostData,
    headers?: Record<string, string>,
    confirmationData?: Record<string, string>
  ): Promise<PostResult>;

  /**
   * BBSのメニュー（板一覧）を取得します。
   * @param menuUrl - bbsmenu.htmlなどのメニューファイルのURL
   * @returns BBSメニューの構造
   */
  getBBSMenu(menuUrl: string): Promise<BBSMenu>;
}
