import { format } from "date-fns";
import { ja } from "date-fns/locale";

export const formatDate = (date: Date): string => {
    return format(date, "yyyy/MM/dd(E) HH:mm:ss", { locale: ja });
};
