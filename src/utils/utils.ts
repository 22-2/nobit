import { format } from "date-fns";
import { ja } from "date-fns/locale";

export const formatDate = (date: Date): string => {
	return format(date, "yyyy/MM/dd(E) HH:mm:ss", { locale: ja });
};

export const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));
