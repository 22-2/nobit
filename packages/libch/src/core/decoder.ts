// --- 2. デコード処理のインターフェース ---
/**
 * ArrayBufferを文字列にデコードするための抽象インターフェース。
 */

export interface BufferDecoder {
  decode(buffer: ArrayBuffer): string;
}
/**
 * 標準のTextDecoderを使った具体的なデコーダー実装。
 */

export class DefaultDecoder implements BufferDecoder {
  public decode(buffer: ArrayBuffer): string {
    const decoder = new TextDecoder("shift-jis");
    return decoder.decode(buffer);
  }
}
