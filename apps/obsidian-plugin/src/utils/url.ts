import type { ParsedBbsUrl as parsed } from "@nobit/libch/core/url";

export function isURL(url: string | null | undefined) {
    try {
        new URL(url!);
        return true;
    } catch {
        return false;
    }
}
