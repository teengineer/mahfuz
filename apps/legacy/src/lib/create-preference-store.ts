import { create } from "zustand";
import { persist } from "zustand/middleware";

type SetterName<K extends string> = `set${Capitalize<K>}`;

type AutoSetters<T extends Record<string, unknown>> = {
  [K in keyof T & string as SetterName<K>]: (value: T[K]) => void;
};

type StoreWithSetters<T extends Record<string, unknown>> = T & AutoSetters<T>;

export function createPreferenceStore<T extends Record<string, unknown>>(
  name: string,
  defaults: T,
  options?: {
    version?: number;
    migrate?: (persisted: unknown, version: number) => unknown;
  },
) {
  return create<StoreWithSetters<T>>()(
    persist(
      (set) => {
        const setters = {} as Record<string, (value: unknown) => void>;
        for (const key of Object.keys(defaults)) {
          const setterName = `set${key.charAt(0).toUpperCase()}${key.slice(1)}`;
          setters[setterName] = (value: unknown) =>
            set({ [key]: value } as Partial<StoreWithSetters<T>>);
        }
        return { ...defaults, ...setters } as StoreWithSetters<T>;
      },
      {
        name,
        version: options?.version ?? 0,
        migrate: options?.migrate,
      },
    ),
  );
}
