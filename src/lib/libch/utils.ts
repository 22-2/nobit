import type { SubjectItem } from "../types";

export const normalizeDateStr = (str: string) => {
	return str.trim().replace(/\s*\(.\)\s*/, " ");
};

export function invariant(
	condition: any,
	message: string,
	onError?: () => void,
): asserts condition {
	if (!condition) {
		onError?.();
		throw new Error(message);
	}
}

export const formatDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	const seconds = String(date.getSeconds()).padStart(2, "0");

	const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
	const weekday = weekdays[date.getDay()];

	return `${year}/${month}/${day}(${weekday}) ${hours}:${minutes}:${seconds}`;
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
