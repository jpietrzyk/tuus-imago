import { useState } from "react";

export function useFormState() {
  const [dirty, setDirty] = useState<Record<string, string>>({});

  const get = (field: string, fallback: string): string => {
    if (field in dirty) return dirty[field];
    return fallback;
  };

  const set = (field: string, value: string) => {
    setDirty((prev) => ({ ...prev, [field]: value }));
  };

  return { get, set };
}
