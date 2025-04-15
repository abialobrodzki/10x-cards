import { useState, useEffect } from "react";

/**
 * Hook do debounce wartości.
 * Zwraca wartość, która jest aktualizowana tylko po upływie określonego czasu bez zmian.
 *
 * @param value Wartość wejściowa
 * @param delay Opóźnienie w milisekundach
 * @returns Wartość po debounce
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Ustaw timer, który zaktualizuje wartość po upływie czasu opóźnienia
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Anuluj timer przy każdej zmianie wartości wejściowej lub przy odmontowaniu komponentu
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
