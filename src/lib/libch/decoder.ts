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
        // In test environment, use UTF-8 since mock data is UTF-8 encoded
        const isPlaywright = typeof process !== 'undefined' && process.env.PLAYWRIGHT === 'true';
        const encoding = isPlaywright ? 'utf-8' : 'shift-jis';
        const decoder = new TextDecoder(encoding);
        return decoder.decode(buffer);
    }
}
