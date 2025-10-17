import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { SubjectItem } from "../types";

export const normalizeDateStr = (str: string) => {
	return str.trim().replace(/\s*\(.\)\s*/, " ");
};

export function invariant(
	condition: any,
	message: string,
	onError?: () => void
): asserts condition {
	if (!condition) {
		onError?.();
		throw new Error(message);
	}
}

export const formatDate = (date: Date): string => {
	return format(date, "yyyy/MM/dd(E) HH:mm:ss", { locale: ja });
};

export function calculateIkioi(thread: SubjectItem): number {
	const threadTime = parseInt(thread.id, 10);
	if (isNaN(threadTime)) return 0;
	const nowInSeconds = Date.now() / 1000;
	const elapsedTimeSeconds = nowInSeconds - threadTime;
	if (elapsedTimeSeconds <= 0) return 0;
	const elapsedTimeDays = elapsedTimeSeconds / (24 * 60 * 60);
	return thread.resCount / elapsedTimeDays;
}
