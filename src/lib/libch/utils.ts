import { format } from "date-fns";
import { ja } from "date-fns/locale";

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
	return format(date, "yyyy/MM/dd(E) HH:mm:ss", { locale: ja });
};
