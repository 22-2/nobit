import { format } from "date-fns";
import { ja } from "date-fns/locale";

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

export const unsafeIsTestMode = () => {
  // @ts-expect-error
  if (typeof app !== "undefined") {
    // @ts-expect-error
    if (app.plugins.plugins["my-new-plugin"].settings.isTestMode) {
      return true;
    }
  }
  if (typeof process === "undefined") {
    return false;
  }
  return process.env.TEST_MODE === "true";
};
