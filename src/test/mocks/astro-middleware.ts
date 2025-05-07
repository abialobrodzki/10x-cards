/**
 * @file Mock dla modułu `astro:middleware` używany w środowisku testowym.
 * Zapewnia podstawową implementację `defineMiddleware` do użytku w testach jednostkowych/integracyjnych,
 * pozwalając na testowanie logiki middleware bez rzeczywistego uruchamiania Astro.
 */

// Stub for astro:middleware

/**
 * Mock funkcji `defineMiddleware`.
 * W środowisku testowym zwraca przekazaną funkcję middleware bez modyfikacji.
 * Umożliwia testowanie logiki middleware w izolacji.
 *
 * @template M Typ funkcji middleware.
 * @param {M} middleware Funkcja middleware do zdefiniowania.
 * @returns {M} Przekazana funkcja middleware.
 */
export function defineMiddleware<M extends (...args: unknown[]) => unknown>(middleware: M): M {
  return middleware;
}
