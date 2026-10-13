'use client';

import { useEffect, useState } from 'react';

/** Devuelve `value` recién cuando dejó de cambiar durante `ms` (para búsquedas). */
export function useDebouncedValue<T>(value: T, ms = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
