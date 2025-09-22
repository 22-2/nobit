export function isURL(url: string | null | undefined) {
    try {
        new URL(url!);
        return true;
    } catch {
        return false;
    }
}
