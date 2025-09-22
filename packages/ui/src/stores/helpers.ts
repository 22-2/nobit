import log from "loglevel";
import type { OperationResult } from "./types";

export const handleAsyncOperation = async <T>(
    operation: () => Promise<T>,
    options: OperationResult<T> = {}
): Promise<T | null> => {
    const {
        errorMessage = "操作に失敗しました",
        onStart,
        onSuccess,
        onError,
        onFinally,
    } = options;
    try {
        onStart?.();
        const result = await operation();
        onSuccess?.(result);
        return result;
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        log.error(errorMessage, error);
        onError?.(error);
        return null;
    } finally {
        onFinally?.();
    }
};
