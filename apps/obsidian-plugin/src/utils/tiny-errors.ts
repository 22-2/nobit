export function invariant(
    condition: any,
    message: string,
    onErr?: () => void
): asserts condition {
    if (!condition) {
        onErr?.();
        throw new Error(`Invariant failed: ${message}`);
    }
}

export function throwExpression(error: Error): never {
    throw error;
}
