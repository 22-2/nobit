import log from "loglevel";

const logger = log.getLogger("Decoder");

// --- 2. デコード処理のインターフェース ---
/**
 * ArrayBufferを文字列にデコードするための抽象インターフェース。
 */

export interface BufferDecoder {
	/**
	 * ArrayBufferを文字列にデコードします。
	 * @param buffer - デコード対象のArrayBuffer
	 * @param encoding - オプショナルなエンコーディング指定（例: "utf-8", "shift-jis"）
	 * @returns デコードされた文字列
	 */
	decode(buffer: ArrayBuffer, encoding?: string): string;
}
/**
 * 標準のTextDecoderを使った具体的なデコーダー実装。
 */

export class DefaultDecoder implements BufferDecoder {
	/**
	 * デフォルトのエンコーディング。
	 * テスト環境ではUTF-8、本番環境ではShift-JISを使用。
	 */
	private get defaultEncoding(): string {
		const useDefaultEncoding =
			typeof process !== "undefined" && process.env.USE_UTF8_ENCODING === "true";
		logger.debug(`USE_UTF8_ENCODING: ${useDefaultEncoding}`);
		return useDefaultEncoding ? "utf-8" : "shift-jis";
	}

	public decode(buffer: ArrayBuffer, encoding?: string): string {
		const actualEncoding = encoding ?? this.defaultEncoding;
		const decoder = new TextDecoder(actualEncoding);
		logger.debug(`Decoding with encoding: ${actualEncoding}`);
		return decoder.decode(buffer);
	}
}
