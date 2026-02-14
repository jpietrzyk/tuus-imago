import { t } from "@/locales/i18n";

export const tr = (key: string, params?: Record<string, string | number>) =>
  t(key, params);
